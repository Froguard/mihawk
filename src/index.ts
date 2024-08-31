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
  Debugger.log.log('init', options);
}
