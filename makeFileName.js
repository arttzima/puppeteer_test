import path from 'node:path';

const replaceSymbols = (url) => {
  const re = /\.|\//;
  const splited = url.split(re);
  return `${splited.join('-')}`;
};

const makeFileName = (url) => {
  const { hostname, pathname } = url;
  const extname = path.extname(pathname);

  const ending = extname === '' ? '.html' : extname;

  const normalizedPathname = pathname === '/' ? '' : pathname.replace(ending, '');

  const replacedSymbols = replaceSymbols(`${hostname}${normalizedPathname}`);

  return `${replacedSymbols}${ending}`;
};

export default makeFileName;