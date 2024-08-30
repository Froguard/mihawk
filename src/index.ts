'use strict';
import Colors from 'color-cc';
import { LOG_FLAG } from './consts';
import type { MihawkOptions } from './com-types';

/**
 * mihawk
 * @param {MihawkOptions} options
 */
export default function mihawk(options?: MihawkOptions) {
  console.log(LOG_FLAG, Colors.gray('options:'), options);
}
