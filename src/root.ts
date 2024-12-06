/**
 * 工程根目信息，有别于 consts.ts 中的变量，这里只放一些和根目录的信息
 * - 这部分信息不放到 consts.ts 中，防止形成“循环依赖” (getRootAbsPath所在的path.ts文件中引用了const.ts)
 */
import path from 'path';
import { getRootAbsPath } from './utils/path';

/**
 * Mihawk 包所在的根目录（绝对路径）
 */
export const PKG_ROOT_PATH = getRootAbsPath();

/**
 * assets 路径(相对于工程根目录，短路径)
 */
export const ASSET_DIR = './assets';

/**
 * assets 目录的绝对路径
 */
export const ASSET_DIR_PATH = path.resolve(PKG_ROOT_PATH, ASSET_DIR);

/**
 * favicon 文件，绝对路径
 */
export const ASSET_FAVICON_PATH = path.resolve(PKG_ROOT_PATH, `${ASSET_DIR}/favicon.ico`);

/**
 * 本地证书 key 文件，绝对路径
 */
export const ASSET_CERT_LOCAL_KEY_PATH = path.resolve(PKG_ROOT_PATH, `${ASSET_DIR}/.cert/localhost.key`);

/**
 * 本地证书 crt 文件，绝对路径
 */
export const ASSET_CERT_LOCAL_CRT_PATH = path.resolve(PKG_ROOT_PATH, `${ASSET_DIR}/.cert/localhost.crt`);

/**
 * CA 证书 crt 文件，绝对路径
 */
export const ASSET_CERT_CA_CRT_PATH = path.resolve(PKG_ROOT_PATH, `${ASSET_DIR}/.cert/ca.crt`);

/**
 * 404 页面模板文件绝对路径
 */
export const ASSET_TPL_HTML_404_PATH = path.resolve(PKG_ROOT_PATH, `${ASSET_DIR}/tpl/404.html`);

/**
 * 500 页面模板文件绝对路径
 */
export const ASSET_TPL_HTML_50X_PATH = path.resolve(PKG_ROOT_PATH, `${ASSET_DIR}/tpl/50x.html`);
