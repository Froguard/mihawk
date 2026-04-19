'use strict';
/**
 * 公共变量
 * - 1. 理论上，本文件不可以 import 其他任何包，三方包除外
 * - 2. 本文件只存储常量值（或者运行时的常量值）
 */
import path from 'path';
import Colors from 'color-cc';
import { MihawkOptions, MihawkRC } from './com-types';

/**
 * 本工程的 npm 包名
 */
export const PKG_NAME = 'mihawk';

/**
 * 控制台打印输出时候的统一前缀
 */
export const LOG_FLAG = `${Colors.magenta(`[${PKG_NAME}]`)}${Colors.gray(':')}`;

/**
 * 日志字符，右箭头
 */
export const LOG_ARROW = Colors.gray('->');

/**
 * 当前的执行目录
 */
export const CWD = process.cwd();

/**
 * 默认的 mock 目录
 */
export const MOCK_DIR_NAME = 'mocks';

/**
 * 默认的 mock 数据目录 (其会作为mocks目录的子文件夹名称)
 */
export const MOCK_DATA_DIR_NAME = 'data';

/**
 * 默认的 mock 模板目录 (其会作为mocks目录的子文件夹名称)
 */
export const MOCK_TPL_DIR_NAME = 'template';

/**
 * 跟陌路配置文件，默认配置
 */
export const DEFAULT_RC: MihawkRC = Object.freeze({
  // base
  host: '0.0.0.0',
  port: 8888,
  https: false,
  cors: true,
  cache: false,
  watch: true,
  // paths
  mockDir: MOCK_DIR_NAME,
  // mock data file
  mockDataFileType: 'json',
  // mock logic file
  mockLogicFileType: 'none',
  autoCreateMockLogicFile: false,
  // typescript
  tsconfigPath: null, // `./${MOCK_DIR_NAME}/tsconfig.json`,
  //
  logConfig: null,
});

/** mocks */
const DEFAULT_MOCKS_DIR = path.resolve(CWD, MOCK_DIR_NAME);
/** mocks/data */
const DEFAULT_MOCKS_DATA_DIR = path.resolve(DEFAULT_MOCKS_DIR, MOCK_DATA_DIR_NAME);
/** mocks/template */
const DEFAULT_MOCKS_TPL_DIR = path.resolve(DEFAULT_MOCKS_DIR, MOCK_TPL_DIR_NAME);

/**
 * 默认的 mihawk options
 * - 在 rc 配置之上额外增加，方便逻辑计算，初始赋值逻辑详见 formatOptionsByConfig 方法
 */
const defOpts: MihawkOptions = {
  ...DEFAULT_RC,
  // base
  useHttps: false,
  // paths
  mockDirPath: DEFAULT_MOCKS_DIR,
  mockTplDirPath: DEFAULT_MOCKS_TPL_DIR,
  mockDataDirPath: DEFAULT_MOCKS_DATA_DIR,
  // mock data file
  dataFileExt: 'json',
  // mock logic file
  useLogicFile: false,
  logicFileExt: '', // 为空表示没有
  // typescript
  isTypesctiptMode: false,
  // routes file
  routesFilePath: path.resolve(DEFAULT_MOCKS_DIR, 'routes.json'),
  // middleware file
  middlewareFilePath: null, // path.resolve(DEFAULT_MOCKS_DIR, 'middleware.js'),
  useWS: false,
  // socketFilePath
  socketFilePath: null,
  // mock json template file
  mockJsonTplPath: path.resolve(DEFAULT_MOCKS_TPL_DIR, 'json.tpl'),
};
export const DEFAULT_OPTIONS = Object.freeze(defOpts);
