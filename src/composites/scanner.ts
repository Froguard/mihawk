'use strict';
import { existsSync } from 'fs-extra';
import { absifyPath } from '../utils/path';
import { Printer } from '../utils/print';

/**
 * @param {string} mockDataDirPath
 * @param {string} dataFileExt "json" | "json5""
 */
export async function scanExistedMockJsonFiles(mockDataDirPath: string, dataFileExt?: string) {
  const existedRoutes: string[] = [];
  mockDataDirPath = absifyPath(mockDataDirPath);
  if (existsSync(mockDataDirPath)) {
    dataFileExt = dataFileExt || 'json';
    // TODO: 待实现
    // ...
  } else {
    Printer.warn(`mock data dir ${mockDataDirPath} not existed!`);
  }
  return existedRoutes;
}
