'use strict';
'use strict';
import Colors from 'color-cc';
import { LOG_FLAG } from './consts';
import { Debugger } from './utils/debug';
import type { MihawkOptions } from './com-types';

/**
 * mihawk
 * @param {MihawkOptions} options
 */
export default function mihawk(options?: MihawkOptions) {
  Debugger.log('init', options);
  const {
    port = 3000,
    host = 'localhost',
    https = false,
    cors = true,
    cache = true,
    logConfig = {},
    mockDir = 'mock',
    mockDataFileType = 'json',
    mockLogicFileType = 'none',
    tsconfigPath = './mocks/tsconfig.json',
    autoCreateMockFile = true,
  } = options || {};
}
