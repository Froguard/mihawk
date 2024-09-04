'use strict';
import { join, basename, relative, resolve, isAbsolute } from 'path';
import { existsSync } from 'fs-extra';
import { CWD } from '../consts';
import { Printer, Debugger } from './print';

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
