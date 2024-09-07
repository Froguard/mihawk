'use strict';
import { Printer } from './print';
/**
 * 强行退出
 * @param {function} beforeQuit
 */
export function processExit(code: number = 1, beforeQuit?: () => void) {
  if (typeof beforeQuit === 'function') {
    beforeQuit();
  }
  Printer.log('Will exiit process...');
  console.log();
  process.exit(code);
}
