'use strict';
/**
 * .mihawkrc.ts|js|json 配置文件相关操作逻辑
 */
import { join, basename } from 'path';
import Colors from 'color-cc';
import { cosmiconfig } from 'cosmiconfig';
import { existsSync, writeFileSync } from 'fs-extra';
import deepmerge from 'deepmerge';
import { CWD, DEFAULT_RC, MOCK_DIR_NAME, MOCK_DATA_DIR_NAME } from '../consts';
import { Loosify, MihawkRC, MihawkOptions } from '../com-types';
import { Debugger, Printer } from '../utils/print';
import { absifyPath, getLogicFileExt } from '../utils/path';

interface InitOptions<T = any> {
  fileType?: 'json' | 'js' | 'ts';
  initConfig?: T;
  tsInfo?: {
    typeName: string;
    typeImportId: string;
  };
  overwrite?: boolean; // 是否覆盖
}
/**
 * 初始化 .xxxrc.json|js|ts 配置文件
 * @param {string} name 配置文件名（包含 . 前缀，以及 rc 后缀，如 .abcrc；不强制，只是推荐）
 * @param {InitOptions}
 * @param {"json"|"js"|"ts"} options.fileType
 * @param {any} options.initConfig
 * @returns {Promise<void>}
 */
export async function initRCfile<T = any>(name: string, options: InitOptions<T> = { fileType: 'json' }) {
  const { fileType = 'json', overwrite = false, initConfig = {}, tsInfo = null } = options;
  const rcType = fileType || 'json';
  const rcName = `${name}.${rcType}`;
  Printer.log(`init ${rcName} file..`);
  // detect if existed or not
  const rcFilePath = join(CWD, `./${rcName}`);
  if (existsSync(rcFilePath)) {
    if (overwrite) {
      Printer.log(`Force Update file ${rcName}..`);
    } else {
      Printer.log(`${rcName} file already exists. Will skip it..`);
      return;
    }
  }
  // init content
  let initContent = JSON.stringify(initConfig || {}, null, 2);
  switch (rcType) {
    case 'ts': {
      const { typeName, typeImportId } = tsInfo || {};
      const hasTypeInfo = typeName && typeImportId;
      const importTypeCode = hasTypeInfo ? `import type { ${typeName} } from '${typeImportId}';` : '';
      initContent = [
        '"use strict";',
        '/**',
        ` * ${name}.ts`,
        ' */',
        importTypeCode,
        '',
        `const config: ${hasTypeInfo ? typeName : 'any'} = ${initContent};`, //
        'export default config;',
        '',
      ].join('\n');
      break;
    }
    case 'js': {
      initContent = [
        '"use strict";',
        '/**',
        ` * ${name}.js`,
        ' */',
        '',
        `module.exports = ${initContent};`, //
        '',
      ].join('\n');
      break;
    }
    case 'json':
    default:
      // initContent = JSON.stringify(initConfig, null, 2);
      break;
  }
  // write file
  writeFileSync(rcFilePath, initContent, { encoding: 'utf8' });
}

interface GetRcOptions<T = any> {
  initConfig?: T;
}

/**
 * 加载根目录配置文件
 * @param {string} name 配置文件名（包含 . 前缀，以及 rc 后缀，如 .abcrc；不强制，只是推荐）
 * @param {GetRcOptions} options
 * @param {any} options.initConfig 如果不存在时，进行初始化，所需要的初始数据
 * @returns {Promise<FrogaguRcConfig>}
 */
export async function getRcData<T = any>(name: string, options?: GetRcOptions<Partial<T>>): Promise<Partial<T>> {
  const { initConfig = {} } = options || {};
  const defConfig = Object.assign({}, initConfig);
  const rcNames = [`${name}.json`, `${name}.js`, `${name}.ts`];
  try {
    if (rcNames.some(fileName => existsSync(join(CWD, fileName)))) {
      // 使用 cosmiconfig 进行 rc 文件的加载
      const explorer = cosmiconfig(name, {
        stopDir: CWD, // 搜索停止的目录
        searchPlaces: rcNames, // 搜索文件顺序
        packageProp: name.replace(/^\.+/g, ''), // package.json 中的属性名
      });
      const res = await explorer.search(CWD);
      const { config, filepath } = res || {};
      Printer.log(Colors.success(`load root-config file: ${Colors.gray(basename(filepath))}`));
      Debugger.log('root-config: ', config);
      return (config as Partial<T>) || defConfig;
    } else {
      // 未检测到rc文件时，进行自动创建
      Printer.log(Colors.warn(`Can't found rc-file(.${name}.js|json|ts). Will auto create & init it..`)); // prettier-ignore
      await initRCfile(name, { fileType: 'json', initConfig: defConfig, overwrite: false });
      return defConfig;
    }
  } catch (error) {
    //
    Printer.error(Colors.error('load config file error..'), error);
    return defConfig;
  }
}

/**
 * 格式化 rc 配置
 * @param {any} oldConfig
 */
export function formatOptionsByConfig(oldConfig: Loosify<MihawkRC>) {
  const config: Loosify<MihawkOptions> = deepmerge({}, { ...oldConfig });
  // 1.remove invalid keys
  ['_', '--', 'h', 'H', 'help', 'v', 'V', 'version'].forEach(key => delete config[key]);
  // 2.resolve alias
  if (config.p !== undefined) {
    // p alias for port
    config.port = config.p;
    delete config.p;
  }
  if (config.d !== undefined) {
    // d alias for mockDir
    config.mockDir = config.d || MOCK_DIR_NAME;
    delete config.d;
  }
  if (config.w !== undefined) {
    // w alias for watch
    config.watch = config.w;
    delete config.w;
  }
  // 3.set default values
  deepmerge(config, DEFAULT_RC);
  // 4.reset | format speaially keys
  config.port = Number(config.port); // port
  config.mockDirPath = absifyPath(config.mockDir || MOCK_DIR_NAME); // mockDirPath
  config.mockDataDirPath = join(config.mockDirPath, MOCK_DATA_DIR_NAME); // mockDataDirPath
  // tsconfigPath
  if (config.tsconfigPath) {
    config.tsconfigPath = absifyPath(config.tsconfigPath);
  } else {
    config.tsconfigPath = join(config.mockDirPath, 'tsconfig.json');
  }
  // isTypesctiptMode
  const { mockDataFileType, mockLogicFileType } = config || {};
  config.isTypesctiptMode = mockLogicFileType === 'ts' || mockLogicFileType === 'typescript';
  // useLogicFile
  config.useLogicFile = mockLogicFileType !== 'none';
  const logicFileExt = getLogicFileExt(mockLogicFileType);
  // routesFilePath
  config.routesFilePath = join(config.mockDirPath, `./routes.${logicFileExt}`);
  // middlewareFilePath
  config.middlewareFilePath = join(config.mockDirPath, `./middleware.${logicFileExt}`);
  // logicFileExt
  config.logicFileExt = logicFileExt;
  // dataFileExt
  config.dataFileExt = mockDataFileType;
  // useHttps
  config.useHttps = !!config.https || typeof config.https === 'object';
  //
  //
  return config as MihawkOptions;
}
