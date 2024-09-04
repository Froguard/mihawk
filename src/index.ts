'use strict';
import path from 'path';
import Koa from 'koa';
import Colors from 'color-cc';
import { DEFAULT_RC } from './consts';
import { Printer, Debugger } from './utils/print';
import type { MihawkOptions } from './com-types';

/**
 * mihawk
 * @param {MihawkOptions} options
 */
export default function mihawk(options?: MihawkOptions) {
  Debugger.log('init', options);
  const {
    port = DEFAULT_RC.port,
    host = DEFAULT_RC.host,
    https = DEFAULT_RC.https,
    cors = DEFAULT_RC.cors,
    cache = DEFAULT_RC.cache,
    mockDir = DEFAULT_RC.mockDir,
    mockDataFileType = DEFAULT_RC.mockDataFileType,
    mockLogicFileType = DEFAULT_RC.mockLogicFileType,
    autoCreateMockLogicFile = DEFAULT_RC.autoCreateMockLogicFile,
    watch = DEFAULT_RC.watch,
    // tsconfigPath = DEFAULT_RC.tsconfigPath,
    logConfig = DEFAULT_RC.logConfig,
  } = options || {};
  const tsconfigPath = path.join(mockDir, './tsconfig.json');
}
