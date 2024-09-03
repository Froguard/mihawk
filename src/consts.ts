'use strict';
/**
 * 公共变量
 * - 1. 理论上，本文件不可以 import 其他任何包，三方包除外
 * - 2. 本文件只存储常量值（或者运行时的常量值）
 */
import Colors from 'color-cc';
import { MihawkRC } from './com-types';

/**
 * 本工程的 npm 包名
 */
export const PKG_NAME = 'mihawk';

/**
 * 控制台打印输出时候的统一前缀
 */
export const LOG_FLAG = `${Colors.magenta(`[${PKG_NAME}]`)}${Colors.gray(':')}`;

/**
 * 当前的执行目录
 */
export const CWD = process.cwd();

/**
 * 默认的 mihawk 配置
 */
export const DEFAULT_RC: MihawkRC = {
  host: '0.0.0.0',
  port: 8888,
  https: false,
  cors: true,
  cache: false,
  watch: true,
  mockDir: 'mocks',
  mockDataFileType: 'json',
  mockLogicFileType: 'none',
  autoCreateMockLogicFile: false,
  tsconfigPath: './mocks/tsconfig.json',
};
