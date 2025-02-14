import puppeteer from 'puppeteer';
import path from 'node:path';
import fsp from 'fs/promises';
import { fileURLToPath, URL } from 'url';
import makeFileName from './makeFileName.js';

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const axios = require('axios');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


(async () => {
  // Launch the browser and open a new blank page
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  // Navigate the page to a URL
  await page.goto('https://www.tus.si/#s2');

  // Set screen size
  await page.setViewport({width: 1080, height: 1024});


  // Находим ссылку каталога и переходим по ней
  const catalogLink = await page.evaluate(() => document.querySelector('.menu-primary > li > a').href);
  await page.goto(catalogLink);

  // Собираем информацию о имеющимся каталогам в объект, чтобы потом использовать эту информацию
  // для записив в json, а также ссылкы нужны для загрузки pdf.
  const catalogSummary = await page.evaluate(() => {
    const list = document.querySelectorAll('.catalogues-grid .list-item');
    const summary = [...list].reduce((acc, item) => {
      const title = item.querySelector('.hover h3').innerText;
      acc[title] = {};

      const link = item.querySelector('.hover .pdf').href;
      acc[title]['link'] = link;

      const from = item.querySelector('.card p time').getAttribute('datetime');
      acc[title]['from'] = from;

      const to = item.querySelector('.card p time:last-child').getAttribute('datetime');
      acc[title]['to'] = to;


      return acc;
    }, {});

    return summary;
  });

  // Сохраняем информацию о каталогах
  fsp.writeFile(path.join(__dirname, 'downloads', 'info.json'), JSON.stringify(catalogSummary))
  .catch((e) => `Unfortunately the file was not saved, here is an error ${e}`);


  // Извлекаем ссылки для загрузки pdf
  const linksToLoad = Object.entries(catalogSummary).map(([ , info ]) => info.link);


  // Загружаем и сохраняем каталоги
  linksToLoad.forEach(async (link) => {
    console.log(link)
    const loadPath = path.join(__dirname, 'downloads');
    const fileName = path.join(loadPath, makeFileName(new URL(link)));
    console.log(loadPath)
    
      axios.get(link, { responseType: 'arraybuffer'})
      .then((response) => response.data)
      .then((buff) => fsp.writeFile(fileName, buff))
      .catch((e) => console.error(`Unfortunately the ${link} was not loaded, here is an error ${e}`))

    
    
  });

  await browser.close();
})();