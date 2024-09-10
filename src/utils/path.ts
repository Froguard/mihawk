'use strict';
import { join, basename, relative, resolve, isAbsolute, normalize } from 'path';
import { existsSync } from 'fs-extra';
import { CWD } from '../consts';
import { DataFileExt, LoigicFileExt, MihawkRC } from '../com-types';
import { Debugger } from './print';

/**
 * 获取与 CWD 的相对路径
 * @param {string} targetPath
 * @returns {string}
 */
export function relPathToCWD(targetPath: string) {
  return relative(CWD, targetPath);
}

/**
 * 得到绝对路径
 * @param {string} targetPath
 * @param {string} rootPath 相对的根目录（当 targetPath 为相对路径的时候会用到，默认为 CWD）
 * @returns {string}
 */
export function absifyPath(targetPath: string, rootPath: string = CWD) {
  rootPath = rootPath || CWD;
  targetPath = targetPath ? targetPath.trim() : rootPath; // 防止空掉
  const absPath = isAbsolute(targetPath) ? targetPath : resolve(rootPath, targetPath);
  return absPath.replace(/[/\\]+$/, ''); // 消除末尾的 / \
}

/**
 * 针对 windows 这样的路径，统一转换为 unix 风格的路径
 * - eg: \\a\\b\\c → /a/b/c
 * @param {string} targetPath
 * @returns {string}
 */
export function unixifyPath(targetPath: string) {
  return process.platform === 'win32' ? targetPath.replace(/\\+/g, '/') : targetPath;
}

/**
 * 判断目标地址是否存在
 * @param {string} targetPath
 * @param {string} rootPath 相对的根目录（当 targetPath 为相对路径的时候会用到，默认为 CWD）
 * @returns {boolean} isExistedSync
 */
export function isExistedSync(targetPath: string, rootPath: string = CWD) {
  if (!targetPath) {
    return false;
  }
  targetPath = absifyPath(targetPath.trim(), rootPath);
  return existsSync(targetPath);
}

/**
 * 获取本工程（mihawk）的根目录
 * - 作用：用于读取本工程根目录下的文件，如 package.json 文件
 * - 原因：如果采用直接 import 的方式，会导致 tsc 打包之后，目录 dist 之下，会额外输出一个 package.json 文件（这个文件和根目录下的 package.json 文件内容是一样的）
 *
 * 所以，需要动态计算出本工程的根目录，方便之后进行绝对路径的的 require
 *
 * 实现：会判断代码 src 目录是否处于 dist 目录中
 * - 打包前：ts 源码，直接就是正常目录
 * - 打包后：js 产物代码，会得到项目根目录
 *
 * 无论哪种情况，获得到的因为是绝对路径，所以会是同一个值
 * @returns {string}
 * @example
 *   const rootAbsolutePath = getRootAbsPath();
 */
export function getRootAbsPath() {
  /**
   * 无论在 ts 源码还是在 dist 的输出目录中，本文件的结构都会如下
   * src/
   *  ├ ...
   *  ├ utils /
   *  |  ├ ...
   *  |  └ path.ts（本文件）
   *  ├ ...
   *  └ index.ts
   * 差别在于，源码是直接在根目录之下有一个 `./src` 目录，而 dist 的输出目录是 `./dist/{cjs,esm,types}/src`
   * 所以，这里只需要判断一下, src 之上的父目录，是不是在 cjs,esm,types 三者之一，就知道文件是否处于 dist 目录中
   */
  const curDirPath = join(__dirname, '../'); // dir(src) path
  const curParentDirPath = join(curDirPath, '../'); // dir(src)'s parent dir path
  const curParentDirName = basename(curParentDirPath); // dir(src)'s parent dir name
  // detect whether in dist or not
  const isInDist = ['cjs', 'esm', 'types'].some(distSubDir => curParentDirName == distSubDir);
  const rootPath = isInDist ? join(curParentDirPath, '../../') : curParentDirPath;
  Debugger.log('getRootAbsPath', { __dirname, curDirPath, curParentDirPath, isInDist, rootPath });
  return resolve(rootPath);
}

/**
 * 根据文件类型，获取logic文件后缀（logic文件包含mock逻辑文件，以及 middleware文件）
 * @param {MihawkRC['mockLogicFileType']} fileType
 * @param {string} defaultExt 默认的后缀，当 fileType 为 none 的时候，会返回此默认的后缀
 * @returns {string} 文件后缀，不带.点 js|cjs|ts|
 */
export function getLogicFileExt(fileType: MihawkRC['mockLogicFileType']): LoigicFileExt {
  switch (fileType) {
    case 'js':
    case 'javascript':
      return 'js';
    case 'cjs':
      return 'cjs';
    case 'ts':
    case 'typescript':
      return 'ts';
    case 'none':
    default:
      return ''; // none
  }
}

/**
 * 根据文件类型，获取 routes 文件的后缀
 * @param {MihawkRC['mockLogicFileType']} fileType
 * @returns {string} 文件后缀，不带.点  js|cjs|ts|json
 */
export function getRoutesFileExt(fileType: MihawkRC['mockLogicFileType']) {
  return (getLogicFileExt(fileType) || 'json') as LoigicFileExt | 'json';
}

/**
 * 移除文件后缀(js|cjs|ts|json|json5)
 * @param {string} filePath 带后缀的文件路径
 * @returns {string} 不带后缀的文件路径
 */
export function removeSpecialExt(filePath: string) {
  return filePath.replace(/\.(js|cjs|ts|json|json5)$/g, '');
}

/**
 * 格式化路径
 * - 注意，如果末尾有 / 会保留，并不会删除掉，这个和 absifyPath 有区别
 * - 会有 normalize 的效果，即删除 . 和 .. 等内容
 * - 返回的路径是 unix 样式的
 * @param {string} targetPath
 * @returns {string} newPath formated
 */
export function formatPath(targetPath: string) {
  // 注意顺序，unixifyPath 要在 normalize 外层，确保最后产出结果是 unix 样式的
  return unixifyPath(normalize(targetPath));
}

/**
 * 格式化 mock 路径（会统一成 unix 风格）
 * - 对于 `/test/a/b`，会返回 `/test/a/b`
 * - 对于 `/test/a/b.xxx`，会返回 `/test/a/b`
 * - 对于 `/test/a/b.json5`，会返回 `/test/a/b`
 * - 👉🏼 对于 `/test/a/`，会返回 `/test/a/index` 【特别注意】这里的末尾/或转化增加一个 index 后缀
 * - 返回的内容，回事 normalize 的效果，即删除 . 和 .. 等内容
 * @private
 * @param mockPath
 * @returns
 */
export function formatMockPath(mockPath: string) {
  let newPath = formatPath(removeSpecialExt(mockPath));
  newPath = newPath.endsWith('/') ? `${newPath}index` : newPath;
  return newPath;
}

/**
 * 根据 json 文件的路径，获取路由信息
 * - 如： GET/a/b/c.json   →  { method: "GET", path: "/a/b/c" }
 * - 如： get/a/b/c.json   →  { method: "GET", path: "/a/b/c" }
 * - 如： Get/a/b/c.json   →  { method: "GET", path: "/a/b/c" }
 * - 如： /GET/a/b/c.json  →  { method: "GET", path: "/a/b/c" }
 * - 如： myDiy/a/b/c.json →  { method: "MYDIY", path: "/a/b/c" }
 * @param {string} jsonRelPath json 文件的相对路径，即相对于 data 文件夹根目录
 * @param {string} jsonExt
 * @returns {RouteInfo} routeInfo
 */
export function getRouteByJsonPath(jsonRelPath: string, jsonExt: DataFileExt = 'json') {
  const ext = (jsonExt || 'json').replace(/^\.+/g, '');
  const routePath = unixifyPath(jsonRelPath.replace(/^\/+/, '').replace(new RegExp(`\\.${ext}$`), ''));
  const [first, ...others] = routePath.split('/');
  return {
    method: first.toUpperCase(),
    path: `/${others.join('/')}`,
  };
}

/**
 * 判断 targetPath 是否在 dirPath 目录下
 * - eg: isPathInDir('a/b/c/d.txt', 'a/b/c'); // true
 * - eg: isPathInDir('a/b/c', 'a/b/c'); // false
 * - 注意，如果 targetPath === dirPath，会返回 false (因为自己不能在自己里面)
 * @param {string} targetPath
 * @param {string} dirPath
 * @returns {boolean}
 */
export function isPathInDir(targetPath: string, dirPath: string) {
  targetPath = unixifyPath(resolve(targetPath));
  dirPath = unixifyPath(resolve(dirPath));
  return targetPath !== dirPath && targetPath?.length >= dirPath?.length && targetPath?.startsWith(dirPath);
}
