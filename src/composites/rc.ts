'use strict';
/**
 * .mihawkrc.ts|js|json 配置文件相关操作逻辑
 */
import { join, basename } from 'path';
import Colors from 'color-cc';
import { cosmiconfig } from 'cosmiconfig';
import { existsSync } from 'fs-extra';
import deepmerge from 'deepmerge';
import { writeFileSafeSync } from '../utils/file';
import { CWD, DEFAULT_OPTIONS, MOCK_DIR_NAME, MOCK_DATA_DIR_NAME, PKG_NAME } from '../consts';
import { Loosify, MihawkRC, MihawkOptions } from '../com-types';
import { Printer } from '../utils/print';
import { absifyPath, getLogicFileExt } from '../utils/path';
import { isObjStrict } from '../utils/is';

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
      (initConfig as any).$schema = `./node_modules/${PKG_NAME}/assets/schema/root-config.json`;
      initContent = JSON.stringify(initConfig || {}, null, 2);
      break;
  }
  // write file
  writeFileSafeSync(rcFilePath, initContent);
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
      // Printer.log('root-config: ', config);
      return (config as Partial<T>) || defConfig;
    } else {
      // 未检测到rc文件时，进行自动创建
      Printer.log(Colors.yellow(`Can't found rc-file(.${name}.js|json|ts). Will auto create & init it..`)); // prettier-ignore
      await initRCfile(name, { fileType: 'json', initConfig: defConfig, overwrite: false });
      return defConfig;
    }
  } catch (error) {
    //
    Printer.error(Colors.error('Load config file error..'), '\n', error);
    return defConfig;
  }
}

/**
 * 格式化 rc 配置
 * @param {any} config
 */
export function formatOptionsByConfig(config: Loosify<MihawkRC>) {
  // const options = Object.assign({}, DEFAULT_OPTIONS, config);
  const options = deepmerge<Loosify<MihawkOptions>>(
    {},
    {
      ...DEFAULT_OPTIONS, // default
      ...config, // override default by user config
    },
  );

  // 1.remove invalid keys
  ['_', '--', 'h', 'H', 'help', 'v', 'V', 'version'].forEach(key => delete options[key]);

  // 2.resolve alias
  if (options.p !== undefined) {
    // p alias for port
    options.port = options.p;
    delete options.p;
  }
  if (options.d !== undefined) {
    // d alias for mockDir
    options.mockDir = options.d || MOCK_DIR_NAME;
    delete options.d;
  }
  if (options.w !== undefined) {
    // w alias for watch
    options.watch = options.w;
    delete options.w;
  }

  // 3.reset | format speaially keys
  const { mockDataFileType, mockLogicFileType } = options || {};
  // - port mockDirPath mockDataDirPath
  options.port = Number(options.port); // port: make sure it is a number
  options.mockDirPath = absifyPath(options.mockDir || MOCK_DIR_NAME); // mockDirPath
  options.mockDataDirPath = join(options.mockDirPath, MOCK_DATA_DIR_NAME); // mockDataDirPath

  // - isTypesctiptMode
  const isTypesctiptMode = mockLogicFileType === 'ts' || mockLogicFileType === 'typescript';
  options.isTypesctiptMode = isTypesctiptMode;
  // - tsconfigPath
  if (isTypesctiptMode) {
    if (options.tsconfigPath) {
      options.tsconfigPath = absifyPath(options.tsconfigPath);
    } else {
      options.tsconfigPath = join(options.mockDirPath, 'tsconfig.json');
    }
  }

  // - dataFileExt
  const dataFileExt = mockDataFileType;
  options.dataFileExt = dataFileExt;

  // - useLogicFile
  const useLogicFile = mockLogicFileType !== 'none';
  options.useLogicFile = useLogicFile;
  // - logicFileExt
  const logicFileExt = getLogicFileExt(mockLogicFileType);
  options.logicFileExt = logicFileExt;

  // - middlewareFilePath
  if (useLogicFile) {
    options.middlewareFilePath = join(options.mockDirPath, `./middleware.${logicFileExt}`);
  }

  // - routesFilePath
  options.routesFilePath = join(options.mockDirPath, `./routes.${logicFileExt || dataFileExt}`);

  // - useHttps
  options.useHttps = !!options.https || isObjStrict(options.https); // https 为 true，或者为一个对象 { key,cert }

  // - useWS (useWebSocket)
  options.useWS = !!options.socketConfig;
  if (options.useWS) {
    // - socketConfig
    if (typeof options.socketConfig !== 'object') {
      options.socketConfig = {
        host: options.host,
        port: options.port,
        secure: options.useHttps,
        stomp: false,
      };
    }
    // - socketFilePath
    options.socketFilePath = join(options.mockDirPath, `./socket.${logicFileExt}`);
  }

  // - useRemoteData
  options.useRemoteData = typeof options.setJsonByRemote === 'object' && options.setJsonByRemote?.enable;
  //
  //
  return options as MihawkOptions;
}
