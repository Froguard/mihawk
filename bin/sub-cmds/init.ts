'use strict';
import Colors from 'color-cc';
import { LOG_FLAG } from '../../src/consts';
import { debugLog } from '../../src/utils/debug';
import type { SubCmdCallback } from '../../src/com-types';

/**
 * mihawk init
 */
const callback: SubCmdCallback<any> = async function init() {
  debugLog('init...');
};

//
export default callback;
