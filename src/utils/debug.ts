'use strict';
/**
 * debug 操作相关封装：
 * - 1.不导出的成员（类型定义除外），请在命名上保持私有命名风格，以下划线_开头，_xxx
 * - 2.尽可能不互相引用 utils/ 文件夹之下的其他兄弟模块，防止形成循环依赖
 */
import debug from 'debug';
import { PKG_NAME } from '../consts';

/**
 * debug 日志
 */
export const Debugger = { log: debug(PKG_NAME) };
