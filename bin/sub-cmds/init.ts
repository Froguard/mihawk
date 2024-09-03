'use strict';
import path from 'path';
import Colors from 'color-cc';
import { existsSync } from 'fs-extra';
import { CWD, LOG_FLAG, DEFAULT_RC, PKG_NAME } from '../../src/consts';
import { inputNumInCLI, inputTxtInCLI, singleSelectInCli, confirmInCLI } from '../../src/utils/cli';
import { initRCfile } from '../../src/utils/rc';
import type { SubCmdCallback, MihawkRC } from '../../src/com-types';

/**
 * mihawk init
 */
const callback: SubCmdCallback<any> = async function init() {
  const config: Partial<MihawkRC> = {
    ...DEFAULT_RC,
  };
  const configFileName = `.${PKG_NAME}rc`;
  const configFileExt = 'json';
  const configFilePath = path.join(CWD, `${configFileName}.${configFileExt}`);
  const isExisted = existsSync(configFilePath);
  if (isExisted) {
    console.log(LOG_FLAG, Colors.yellow());
    const overwrite = await confirmInCLI(`rcfile ${Colors.gray(configFileName)} is already existed, overwrite it?`, false);
    if (!overwrite) {
      return;
    }
  }
  // TODO: 检查文件已经存在的时候，提示“是否需要覆盖？”，然后再决定是否需要初始化
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
  config.mockDir = await inputTxtInCLI('type in mock data directory', './mock');
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

  console.log(LOG_FLAG, Colors.green(`Will ${isExisted ? 'update' : 'create'} rc file, like below:`), config);
  await initRCfile(configFileName, { fileType: configFileExt, initConfig: config, overwrite: true });
  console.log(LOG_FLAG, Colors.success(`${isExisted ? 'update' : 'create'} ${configFileExt} success!`));
  //
};

//
export default callback;
