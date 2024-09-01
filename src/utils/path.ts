'use strict';
import { join, relative, resolve, isAbsolute } from 'path';
import { existsSync } from 'fs-extra';
import { CWD } from '../consts';

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
