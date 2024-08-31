'use strict';
/**
 * 用于读取本工程根目录下的文件，如 package.json 文件
 * - 原因：如果采用直接 import 的方式，会导致 tsc 打包之后，目录 dist 之下，会额外输出一个 package.json 文件（这个文件和根目录下的 package.json 文件内容是一样的）
 * 所以这里，采用读文件的方式去进行读取
 */
import path from 'path';
import { Debugger } from '../../src/utils/debug';
import type { IPackageJson } from 'package-json-type';

/**
 * 获取本工程的根目录
 *
 * 注意：会判断代码 src 目录是否处于 dist 目录中
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
   * 无论在 ts 源码还是在 dist 的输出目录中，本 js 的结构都会如下
   * bin/
   *  ├ ...
   *  ├ com /
   *  |  ├ ...
   *  |  └ project-root.ts（本文件）
   *  ├ ...
   *  └ index.ts
   * 差别在于，源码是直接在根目录之下有一个 bin 目录，而 dist 的输出目录是 dist/{cjs,esm,types}/bin
   * 所以，这里只需要判断一下, bin 之上的父目录，是不是在 cjs,esm,types 三者之一，就知道文件是否处于 dist 目录中
   */
  const binDirPath = path.join(__dirname, '../'); // dir(bin) path
  const binParentDirPath = path.join(binDirPath, '../'); // dir(bin)'s parent dir path
  const binParentDirName = path.basename(binParentDirPath); // dir(bin)'s parent dir name
  // detect whether in dist or not
  const isInDist = ['cjs', 'esm', 'types'].some(distSubDir => binParentDirName == distSubDir);
  const rootPath = isInDist ? path.join(binParentDirPath, '../../') : binParentDirPath;
  Debugger.log('getRootAbsPath', { __dirname, binDirPath, binParentDirPath, isInDist, rootPath });
  return path.resolve(rootPath);
}

/**
 * 读取本工程跟目录下的文件
 * @param {string} relFilePath
 * @returns {Data}
 */
function _requireFileFromRoot<Data = any>(relFilePath: string) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const data = require(path.resolve(getRootAbsPath(), relFilePath));
  return data as Data;
}

/**
 * 读取本工程的 package.json 文件
 * @returns {IPackageJson} package.json 文件内容
 */
export function readPackageJson() {
  return _requireFileFromRoot<IPackageJson>('./package.json');
}