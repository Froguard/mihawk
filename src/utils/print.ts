import debug from 'debug';
import { PKG_NAME, LOG_FLAG } from '../consts';

/**
 * debug 日志
 */
export const Debugger = { log: debug(PKG_NAME) };

/**
 * console 的封装
 */
export const Printer = {
  /**
   * console.log 的包装
   * @param args 待输出的信息
   */
  log(...args: any[]) {
    if (args.length) {
      console.log(LOG_FLAG, ...args);
    } else {
      console.log();
    }
  },
  /**
   * console.warn 的包装
   * @param args 待输出的信息
   */
  warn(...args: any[]) {
    if (args.length) {
      console.warn(LOG_FLAG, ...args);
    } else {
      console.warn();
    }
  },
  /**
   * console.error 的包装
   * @param args 待输出的信息
   */
  error(...args: any[]) {
    if (args.length) {
      console.error(LOG_FLAG, ...args);
    } else {
      console.error();
    }
  },
};
