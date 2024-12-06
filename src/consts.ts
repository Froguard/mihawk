'use strict';
/**
 * 公共变量
 * - 1. 理论上，本文件不可以 import 其他任何包，三方包除外
 * - 2. 本文件只存储常量值（或者运行时的常量值）
 */
import path from 'path';
import Colors from 'color-cc';
import { MihawkOptions, MihawkRC } from './com-types';
import { getRootAbsPath } from './utils/path';

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
 * Mihawk 包所在的根目录（绝对路径）
 */
export const PKG_ROOT_PATH = getRootAbsPath();

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

/**
 * 默认的 mihawk options
 * - 在 rc 配置之上额外增加，方便逻辑计算，初始赋值逻辑详见 formatOptionsByConfig 方法
 */
const defOpts: MihawkOptions = {
  ...DEFAULT_RC,
  // base
  useHttps: false,
  // paths
  mockDirPath: path.resolve(CWD, MOCK_DIR_NAME),
  mockDataDirPath: path.resolve(CWD, MOCK_DIR_NAME, MOCK_DATA_DIR_NAME),
  // mock data file
  dataFileExt: 'json',
  // mock logic file
  useLogicFile: false,
  logicFileExt: '', // 为空表示没有
  // typescript
  isTypesctiptMode: false,
  // routes file
  routesFilePath: path.resolve(CWD, MOCK_DIR_NAME, 'routes.json'),
  // middleware file
  middlewareFilePath: null, // path.resolve(CWD, MOCK_DIR_NAME, 'middleware.js'),
  useWS: false,
  // socketFilePath
  socketFilePath: null,
};
export const DEFAULT_OPTIONS = Object.freeze(defOpts);

/**
 * assets 路径(相对于工程根目录，短路径)
 */
const assetDir = './assets';
const assetFavicon = `${assetDir}/favicon.ico`; // favicon.ico 文件，相对路径(相对于工程根目录)
const assetCertLocalKey = `${assetDir}/.cert/localhost.key`; // 本地证书 key 文件，相对路径(相对于工程根目录)
const assetCertLocalCrt = `${assetDir}/.cert/localhost.crt`; // 本地证书 crt 文件，相对路径(相对于工程根目录)
const assetCertCaCrt = `${assetDir}/.cert/ca.crt`; // CA 证书 crt 文件，相对路径(相对于工程根目录)
const assetTplHtml404 = `${assetDir}/tpl/404.html`; // 404 页面模板文件相对路径(相对于工程根目录)
const assetTplHtml50X = `${assetDir}/tpl/50x.html`; // 500 页面模板文件相对路径(相对于工程根目录)
/**
 * assets 目录的绝对路径
 */
export const ASSET_DIR_PATH = path.resolve(PKG_ROOT_PATH, assetDir);
/**
 * favicon 文件，绝对路径
 */
export const ASSET_FAVICON_PATH = path.resolve(PKG_ROOT_PATH, assetFavicon);
/**
 * 本地证书 key 文件，绝对路径
 */
export const ASSET_CERT_LOCAL_KEY_PATH = path.resolve(PKG_ROOT_PATH, assetCertLocalKey);
/**
 * 本地证书 crt 文件，绝对路径
 */
export const ASSET_CERT_LOCAL_CRT_PATH = path.resolve(PKG_ROOT_PATH, assetCertLocalCrt);
/**
 * CA 证书 crt 文件，绝对路径
 */
export const ASSET_CERT_CA_CRT_PATH = path.resolve(PKG_ROOT_PATH, assetCertCaCrt);
/**
 * 404 页面模板文件绝对路径
 */
export const ASSET_TPL_HTML_404_PATH = path.resolve(PKG_ROOT_PATH, assetTplHtml404);
/**
 * 500 页面模板文件绝对路径
 */
export const ASSET_TPL_HTML_50X_PATH = path.resolve(PKG_ROOT_PATH, assetTplHtml50X);
