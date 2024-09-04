'use strict';
import path from 'path';
import Koa from 'koa';
import Colors from 'color-cc';
import { existsSync, ensureDirSync, writeFileSync, writeJSONSync } from 'fs-extra';
import { Printer, Debugger } from './utils/print';
import { formatOptionsByConfig } from './utils/rc';
import { enableRequireTsFile, loadJS, loadTS } from './composites/loader';
import { getLogicFileExt } from './utils/path';
import type { KoaMiddleware, Loosify, MihawkRC } from './com-types';

/**
 * mihawk
 * @param {Loosify<MihawkRC>} config
 */
export default async function mihawk(config?: Loosify<MihawkRC>) {
  Debugger.log('init config:', config);
  const options = formatOptionsByConfig(config);
  Printer.log('options:', options);
  //
  const { mockDirPath: MOCKS_ROOT_PATH, mockDataDirPath, mockDataFileType, mockLogicFileType, isTypesctiptMode, tsconfigPath } = options;
  const mockFileExt = getLogicFileExt(mockLogicFileType);
  const mockDataExt = mockDataFileType;
  const supportTypescript = isTypesctiptMode || ['ts', 'typescript'].includes(mockLogicFileType);
  // ensure mock data dir exists
  ensureDirSync(mockDataDirPath);
  //
  // support typescript mode
  if (supportTypescript) {
    // 启用 ts 模式
    const tsconfig = require(tsconfigPath) || {};
    enableRequireTsFile(tsconfig);
  }

  // load routes file
  // const routesFilePath
  // load diy middleware if exists
  const diyMiddlewareFilePath = path.resolve(MOCKS_ROOT_PATH, `./middleware.${mockFileExt}`);
  const hasDiyMiddlewareFile = existsSync(diyMiddlewareFilePath);
  if (hasDiyMiddlewareFile) {
    Printer.log(`load diy middleware file: ${diyMiddlewareFilePath}`);
    const loadFunc = supportTypescript ? loadTS : loadJS;
    const diyMiddleware = (await loadFunc(diyMiddlewareFilePath)) as KoaMiddleware;
  }
}
