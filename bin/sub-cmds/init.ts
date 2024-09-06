'use strict';
import path from 'path';
import Colors from 'color-cc';
import { existsSync, ensureDirSync, ensureFileSync } from 'fs-extra';
import { CWD, DEFAULT_RC, MOCK_DATA_DIR_NAME, MOCK_DIR_NAME, PKG_NAME } from '../../src/consts';
import { writeFileSafeSync, writeJSONSafeSync } from '../../src/utils/file';
import { inputNumInCLI, inputTxtInCLI, singleSelectInCli, confirmInCLI } from '../../src/utils/cli';
import { initRCfile, getRcData } from '../../src/composites/rc';
import { getLogicFileExt, getRoutesFileExt } from '../../src/utils/path';
import { Printer } from '../../src/utils/print';
import routesDemo from './demo-routes.json';
import dataDemo from './demo-data.json';
import type { SubCmdCallback, MihawkRC } from '../../src/com-types';

/**
 * mihawk init
 */
const callback: SubCmdCallback<any> = async function init() {
  const configFileName = `.${PKG_NAME}rc`;
  // 1. init root config file
  await initRootConfigFileViaCli(configFileName);
  // 2. init mock data dir
  const curConfig = await getRcData<MihawkRC>(configFileName);
  const { mockDir, mockLogicFileType } = curConfig || {};
  await initMockDataDir(mockDir);
  // 3. init mock routes.json
  await initMockRoutesFile(mockLogicFileType, mockDir);
  // 4. init mock middleware file
  await initMockMiddlewareFile(mockLogicFileType, mockDir);
  //
  console.log();
};

//
export default callback;

//
//
// ================================================== privete functions: ==================================================
//
//

/**
 * 通过命令行交互，去初始化 rc-file
 * @returns {Promise<void>}
 */
async function initRootConfigFileViaCli(configFileName: string) {
  const config: Partial<MihawkRC> = {
    // logConfig: {
    //   ignoreRoutes: ['OPTIONS /*'],
    // },
    ...DEFAULT_RC,
  };
  let hasRcExisted = false;
  let existedExt = '';
  for (const ext of ['json', 'js', 'ts']) {
    const rcFilePath = path.join(CWD, `./${configFileName}.${ext}`);
    if (existsSync(rcFilePath)) {
      hasRcExisted = true;
      existedExt = ext;
      break;
    }
  }
  if (hasRcExisted) {
    Printer.log(`RC-file ${Colors.yellow(`${configFileName}.${existedExt}`)} is already existed, skip init!`);
    return;
  }
  //
  // host
  config.host = await inputTxtInCLI('type in host', DEFAULT_RC.host);
  // port
  config.port = await inputNumInCLI('type in port', { initial: DEFAULT_RC.port, min: 1024, max: 10000 });
  // https
  config.https = DEFAULT_RC.https;
  // cors
  config.cors = await confirmInCLI('use cors?', DEFAULT_RC.cors);
  // cache
  config.cache = await confirmInCLI('enable file cache?', DEFAULT_RC.cache);
  // watch
  config.watch = await confirmInCLI('enable file watch?', DEFAULT_RC.watch);
  // mockDir
  config.mockDir = await inputTxtInCLI('type in mock data directory', MOCK_DIR_NAME);
  // mockDataFileType
  config.mockDataFileType = await singleSelectInCli(
    'select mock data json file type',
    [
      { title: 'json', value: 'json' },
      { title: 'json5', value: 'json5', selected: true },
    ],
    0, // 默认选中第一个，即 json
  );
  // mockLogicFileType
  config.mockLogicFileType = (await singleSelectInCli(
    'select mock data logic file type (dafault none)',
    [
      { title: 'none', value: 'none' },
      { title: 'js(javascript)', value: 'js' },
      { title: 'cjs(same as js, with .cjs ext)', value: 'cjs' },
      { title: 'ts(typescript)', value: 'ts' },
    ],
    0, // 默认选中第一个，即 none
  )) as MihawkRC['mockLogicFileType'];
  // tsconfigPath
  if (config.mockLogicFileType === 'typescript') {
    const defTsConfigPath = path.join(config.mockDir, './tsconfig.json');
    config.tsconfigPath = await inputTxtInCLI(`type in tsconfig.json filepath`, defTsConfigPath);
  }
  // autoCreateMockLogicFile
  config.autoCreateMockLogicFile = await confirmInCLI('Auto create mock data file?', DEFAULT_RC.autoCreateMockLogicFile);
  //
  const configFileExt = 'json';
  const configFileNameWithExt = `${configFileName}.${configFileExt}`;
  Printer.log('Will init rc file, like below:', config);
  await initRCfile(configFileName, {
    fileType: configFileExt,
    initConfig: config,
    overwrite: true,
    tsInfo: {
      // 如果rc 文件是 ts 类型，则需要生成语句 import { MihawkRC } from 'mihawk/com-types';
      typeImportId: `${PKG_NAME}/com-types`,
      typeName: 'MihawkRC',
    },
  });
  Printer.log(Colors.success(`Init ${configFileNameWithExt} success!`));
}

/**
 * 初始化 mock data dir (如果不存在的话，才会创建)
 */
async function initMockDataDir(mockDirName: string = MOCK_DIR_NAME) {
  const mockDataDir = path.join(mockDirName || MOCK_DIR_NAME, MOCK_DATA_DIR_NAME);
  const mockDataDirPath = path.join(CWD, mockDataDir);
  if (!existsSync(mockDataDirPath)) {
    ensureDirSync(mockDataDirPath);
    Printer.log(Colors.success(`Create mock data dir ${Colors.green(mockDataDir)} success!`));
  }
  // detect subDirs
  for (const subDir of ['PUT', 'DELETE', 'POST', 'GET']) {
    const subDirPath = path.join(mockDataDirPath, subDir);
    if (!existsSync(subDirPath)) {
      ensureFileSync(path.join(subDirPath, '.gitkeep'));
      const subDirPathRel = path.join(mockDataDir, subDir);
      Printer.log(Colors.success(`Create mock data dir ${Colors.green(subDirPathRel)} success!`));
    }
  }
  // demo data json file
  const demoFilePathRel = path.join(mockDataDir, './GET/test.json');
  const demoFilePath = path.join(CWD, demoFilePathRel);
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
async function initMockRoutesFile(fileType: MihawkRC['mockLogicFileType'] = 'none', mockDirName: string = 'mocks') {
  const fileExt = getRoutesFileExt(fileType) || 'json';
  const routesFileName = `routes.${fileExt}`;
  const routesFilePathRel = path.join(mockDirName, routesFileName);
  const routesFilePathAbs = path.join(CWD, mockDirName, routesFileName);
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
      '//',
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
    ensureDirSync(path.join(CWD, mockDirName));
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
async function initMockMiddlewareFile(fileType: MihawkRC['mockLogicFileType'] = 'none', mockDirName: string = 'mocks') {
  const fileExt = getLogicFileExt(fileType);
  const middlewareFileName = `middleware.${fileExt || 'cjs'}`;
  const middlewareFilePathRel = path.join(mockDirName, middlewareFileName);
  const middlewareFilePathAbs = path.join(CWD, mockDirName, middlewareFileName);
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
      '//',
    ];
    let initContent = '';
    switch (fileType) {
      case 'ts':
      case 'typescript':
        initContent = [
          ...comPrefixs,
          `import { Context, Next } from 'koa';`,
          // `import { KoaContext, KoaNext } from '${PKG_NAME}/com-types';`,
          '//',
          'export default async function middleware(ctx: Context, next: Next) {',
          '  // do something here', //
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
          'module.exports = async function middleware(ctx, next) {',
          '  // do something here', //
          '}',
          '',
        ].join('\n');
        break;
    }
    ensureDirSync(path.join(CWD, mockDirName));
    writeFileSafeSync(middlewareFilePathAbs, initContent);
    Printer.log(Colors.success(`Init mock middleware file ${Colors.green(middlewareFilePathRel)} success!`));
  }
}
