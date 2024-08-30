/**
 * 公共变量
 * - 1. 理论上，本文件不可以 import 其他任何包，三方包除外
 * - 2. 本文件只存储常量值（或者运行时的常量值）
 */
import path from 'path';
import { homedir } from 'os';
import Colors from 'color-cc';

/**
 * 控制台打印输出时候的统一前缀
 */
export const LOG_FLAG = `${Colors.magenta('[mihawk]')}${Colors.gray(':')}`;
