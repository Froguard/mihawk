'use strict';
import { join, relative } from 'path';
import { existsSync, readdirSync } from 'fs-extra';
import { absifyPath, getRouteByJsonPath } from '../utils/path';
import { Printer } from '../utils/print';
import { DataFileExt } from '../com-types';

/**
 * 扫描指定文件夹目录之下的 json 文件
 * @param {string} targetDirPath 目录地址
 * @param {DataFileExt} jsonExt 文件类型后缀名 "json" | "json5""
 * @returns {string[]} 文件路径数组
 */
export function findJsonFiles(targetDirPath: string, jsonExt: DataFileExt = 'json') {
  const filePathList: string[] = [];
  targetDirPath = absifyPath(targetDirPath);
  if (existsSync(targetDirPath)) {
    const fileExt = `.${(jsonExt || 'json').replace(/^\.+/g, '')}`;
    // eslint-disable-next-line no-inner-declarations
    function _scanDir(dirPath: string, baseDirPath: string) {
      const subItems = readdirSync(dirPath, { withFileTypes: true });
      for (const item of subItems) {
        const subPath = join(dirPath, item.name);
        if (item.isFile() && item.name.endsWith(fileExt)) {
          filePathList.push(relative(baseDirPath, subPath));
        } else if (item.isDirectory()) {
          _scanDir(subPath, baseDirPath);
        }
      }
    }
    _scanDir(targetDirPath, targetDirPath);
  } else {
    Printer.warn(`mock data dir ${targetDirPath} not existed!`);
  }
  return filePathList;
}

/**
 * 扫描 mocks/data 目录，让后获取路由信息
 * @param {string} dataDirPath
 * @param {string} jsonExt
 * @returns {RouteInfo[]}
 */
export function scanExistedRoutes(dataDirPath: string, jsonExt: DataFileExt = 'json') {
  const ext = jsonExt || 'json';
  const existedJsonPaths = findJsonFiles(dataDirPath, ext);
  return existedJsonPaths.map(jsonPath => getRouteByJsonPath(jsonPath, ext));
}
