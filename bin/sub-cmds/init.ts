'use strict';
import path from 'path';
import Colors from 'color-cc';
import { existsSync } from 'fs-extra';
import { CWD, DEFAULT_RC, MOCK_DIR_NAME, PKG_NAME } from '../../src/consts';
import { inputNumInCLI, inputTxtInCLI, singleSelectInCli, confirmInCLI } from '../../src/utils/cli';
import { initRCfile, getRcData } from '../../src/composites/rc';
import { Printer } from '../../src/utils/print';
import { initMockDataDir, initMockRoutesFile, initMockMiddlewareFile } from '../../src/composites/init-file';
import { delNillProps } from '../../src/utils/obj';
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
  config.cors = await confirmInCLI('enable cors?', DEFAULT_RC.cors);
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
  if (config.mockLogicFileType === 'typescript' || config.mockLogicFileType === 'ts') {
    const defTsConfigPath = path.join(config.mockDir, './tsconfig.json');
    if (defTsConfigPath && existsSync(defTsConfigPath)) {
      config.tsconfigPath = await inputTxtInCLI(`type in tsconfig.json filepath`, defTsConfigPath);
    }
  }
  // autoCreateMockLogicFile
  if (config.mockLogicFileType !== 'none') {
    config.autoCreateMockLogicFile = await confirmInCLI('Auto create mock logic file(js|cjs|ts)?', DEFAULT_RC.autoCreateMockLogicFile);
  }

  //
  // delete null|undfined props in config
  delNillProps(config);
  //
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
