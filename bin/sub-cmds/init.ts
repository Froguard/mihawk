'use strict';
import Colors from 'color-cc';
import { LOG_FLAG } from '../../src/consts';
import { Debugger } from '../../src/utils/debug';
import type { SubCmdCallback, MihawkRC } from '../../src/com-types';

/**
 * mihawk init
 */
const callback: SubCmdCallback<any> = async function init() {
  Debugger.log('init...');
};

//
export default callback;
