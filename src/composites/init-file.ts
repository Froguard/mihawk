'use strict';
import { join } from 'path';
import Colors from 'color-cc';
import { existsSync, ensureDirSync, ensureFileSync } from 'fs-extra';
import { writeJSONSafeSync, writeFileSafeSync } from '../utils/file';
import { Printer } from '../utils/print';
import { absifyPath, getLogicFileExt, getRoutesFileExt } from '../utils/path';
import { CWD, PKG_NAME, MOCK_DATA_DIR_NAME, MOCK_DIR_NAME } from '../consts';
import type { MihawkRC, LoigicFileExt } from '../com-types';
//

// mock data demo
const dataDemo = {
  code: 200,
  data: {
    str: 'test',
  },
  message: 'success',
};

// reoutes demo
const routesDemo = {
  'GET /test': './GET/test',
  'GET /test-*': './GET/test',
};

/**
 * 初始化 mock data dir (如果不存在的话，才会创建)
 */
export async function initMockDataDir(mockDirName: string = MOCK_DIR_NAME) {
  const mockDataDir = join(mockDirName || MOCK_DIR_NAME, MOCK_DATA_DIR_NAME);
  const mockDataDirPath = join(CWD, mockDataDir);
  if (!existsSync(mockDataDirPath)) {
    ensureDirSync(mockDataDirPath);
    Printer.log(Colors.success(`Create mock data dir ${Colors.green(mockDataDir)} success!`));
  }
  // detect subDirs
  for (const subDir of ['PUT', 'DELETE', 'POST', 'GET']) {
    const subDirPath = join(mockDataDirPath, subDir);
    if (!existsSync(subDirPath)) {
      ensureFileSync(join(subDirPath, '.gitkeep'));
      const subDirPathRel = join(mockDataDir, subDir);
      Printer.log(Colors.success(`Create mock data dir ${Colors.green(subDirPathRel)} success!`));
    }
  }
  // demo data json file
  const demoFilePathRel = join(mockDataDir, './GET/test.json');
  const demoFilePath = join(CWD, demoFilePathRel);
  if (!existsSync(demoFilePath)) {
    writeJSONSafeSync(demoFilePath, dataDemo);
    Printer.log(Colors.success(`Create mock data file ${Colors.green(demoFilePathRel)} success!`));
  }
}

/**
 * 初始化 mock routes file
 * @param {MihawkRC['mockLogicFileType']} fileType
 * @param {string} mockDirName
 * @returns
 */
export async function initMockRoutesFile(fileType: MihawkRC['mockLogicFileType'] = 'none', mockDirName: string = 'mocks') {
  const fileExt = getRoutesFileExt(fileType) || 'json';
  const routesFileName = `routes.${fileExt}`;
  const routesFilePathRel = join(mockDirName, routesFileName);
  const routesFilePathAbs = join(CWD, mockDirName, routesFileName);
  if (existsSync(routesFilePathAbs)) {
    // skip if existed
    Printer.log(`Mock routes file ${Colors.yellow(routesFilePathRel)} is already existed, skip init!`);
    return;
  } else {
    // create if not existed
    const demoRouteMap = JSON.stringify(routesDemo, null, 2);
    let initContent = demoRouteMap;
    const comPrefixs = [
      '/**',
      ` * ${PKG_NAME}'s routes file:`, //
      ' */',
    ];
    switch (fileType) {
      case 'js':
      case 'cjs':
      case 'javascript': {
        initContent = [
          ...comPrefixs,
          `module.exports = ${demoRouteMap};`, //
          '',
        ].join('\n');
        break;
      }
      case 'ts':
      case 'typescript':
        initContent = [
          ...comPrefixs,
          `const routes: Record<string, string> = ${demoRouteMap}`,
          '//',
          'export default routes;', //
          '',
        ].join('\n');
        break;
      case 'none':
      default: {
        break;
      }
    }
    // ensure dir existed
    ensureDirSync(join(CWD, mockDirName));
    // write file
    writeFileSafeSync(routesFilePathAbs, initContent);
    Printer.log(Colors.success(`Init mock routes file ${Colors.green(routesFilePathRel)} success!`));
  }
}

/**
 * 初始化 mock middleware file
 * @param {MihawkRC['mockLogicFileType']} fileType
 * @param {string} mockDirName
 * @returns {Promise<void>}
 */
export async function initMockMiddlewareFile(fileType: MihawkRC['mockLogicFileType'] = 'none', mockDirName: string = 'mocks') {
  const fileExt = getLogicFileExt(fileType);
  const middlewareFileName = `middleware.${fileExt || 'cjs'}`;
  const middlewareFilePathRel = join(mockDirName, middlewareFileName);
  const middlewareFilePathAbs = join(CWD, mockDirName, middlewareFileName);
  if (existsSync(middlewareFilePathAbs)) {
    // skip if existed
    Printer.log(`Mock middleware file ${Colors.yellow(middlewareFilePathRel)} is already existed, skip init!`);
    return;
  } else {
    // create if not existed
    const comPrefixs = [
      '/**',
      ` * ${PKG_NAME}'s middleware file:`, //
      ' * - just a Koa Middleware',
      ' */',
    ];
    const methodCommentCode = [
      '/**',
      ' * Middleware functions, to implement some special data deal logic,',
      ' * - This function exec before the default-mock-logic. Simply return or don`t call "await next()" could skip default-mock-logic',
      ' * - This function is a standard KOA middleware that follows the KOA onion ring model',
      ' * - see more：https://koajs.com/#middleware',
      ' * @param {KoaContext} ctx',
      ' * @param {KoaNext} next', //
      ' * @returns {Promise<void>}', //
      ' */',
    ];
    const methodBodyCode = [
      '  // do something here', //
      '  console.log(ctx.url);',
      '  if (ctx.peth === "/diy") {',
      '    ctx.body = "it is my diy logic";',
      '  } else {',
      '    await next(); // default logic (such like mock json logic)',
      '  }',
    ];
    let initContent = '';
    switch (fileType) {
      case 'ts':
      case 'typescript':
        initContent = [
          ...comPrefixs,
          `import typs { Context: KoaContext, Next: KoaNext } from 'koa';`,
          `// import type { KoaContext, KoaNext } from '${PKG_NAME}/com-types';`,
          '',
          ...methodCommentCode, // comment code
          'export default async function middleware(ctx: KoaContext, next: KoaNext) {',
          ...methodBodyCode, // body code
          '}',
          '',
        ].join('\n');
        break;
      case 'none':
      case 'js':
      case 'cjs':
      case 'javascript':
      default:
        initContent = [
          ...comPrefixs,
          '',
          ...methodCommentCode, // comment code
          'module.exports = async function middleware(ctx, next) {',
          ...methodBodyCode, // body code
          '}',
          '',
        ].join('\n');
        break;
    }
    ensureDirSync(join(CWD, mockDirName));
    writeFileSafeSync(middlewareFilePathAbs, initContent);
    Printer.log(Colors.success(`Init mock middleware file ${Colors.green(middlewareFilePathRel)} success!`));
  }
}

//
//
interface MockLogicFileInitOptions {
  routePath: string;
  logicFileExt: LoigicFileExt;
  logicPath4log: string;
  jsonPath4log: string;
  overwrite?: boolean;
}
/**
 * 创建 mock 逻辑文件
 * @param {string} mockLogicFilePath 目标文件路径
 * @param options
 * @returns {void}
 */
export function initMockLogicFile(mockLogicFilePath: string, options: MockLogicFileInitOptions) {
  mockLogicFilePath = absifyPath(mockLogicFilePath);
  const { logicFileExt, routePath, jsonPath4log, overwrite } = options;
  // check logic file ext empty
  if (!logicFileExt) {
    Printer.warn('Empty logic file ext, skip init logic file.');
    return;
  }
  // check file exists
  if (!overwrite && existsSync(mockLogicFilePath)) {
    Printer.warn('File is already exists, skip init logic file.', Colors.gray(mockLogicFilePath));
    return;
  }
  // generate init-content
  let initContent: string = '';
  const commentCode = [
    '"use strict;"',
    '/**', //
    ` * ${routePath}`, //
    ' * This file isn‘t mandatory. If it is not needed (such as when there is no need to modify response data), it can be deleted directly',
    ' */',
  ];
  const methodCommentCode = [
    '/**',
    ' * Mock data resolve function, the original data source is the JSON file with the same name as this file',
    ` * @param {object} originData (${jsonPath4log})`, //
    ' * @param {MhkCvtrExtra} extra { url,method,path,params,query,body }',
    ' * @returns {object} newData',
    ' */',
  ];
  switch (logicFileExt) {
    case 'ts': {
      // typescript dode
      const useTypeDefine = false;
      initContent = [
        ...commentCode,
        useTypeDefine ? `import { MhkCvtrExtra } from "${PKG_NAME}/com-types";\n` : '',
        ...methodCommentCode,
        useTypeDefine
          ? 'export default async function convertData(originData: any, extra: MhkCvtrExtra) {'
          : 'export default async function convertData(originData: Record<string, any>, extra: Record<string, any>) {',
        '  // write your logic here', //
        '  return originData;',
        '}',
      ].join('\n');
      break;
    }
    case 'js':
    case 'cjs':
      // commonjs code
      initContent = [
        ...commentCode,
        '',
        ...methodCommentCode,
        'module.exports = async function convertData(originData, extra) {',
        '  // write your logic here', //
        '  return originData;',
        '};',
      ].join('\n');
      break;
    default:
      break;
  }
  // check initContent
  if (!initContent) {
    Printer.warn('No logic file ext was matched, skip init logic file.', logicFileExt);
    return;
  }
  //
  writeFileSafeSync(mockLogicFilePath, initContent);
}
