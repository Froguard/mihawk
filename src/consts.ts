'use strict';
/**
 * 公共变量
 * - 1. 理论上，本文件不可以 import 其他任何包，三方包除外
 * - 2. 本文件只存储常量值（或者运行时的常量值）
 */
import path from 'path';
import Colors from 'color-cc';
import { MihawkOptions } from './com-types';

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
 * 默认的 mock 目录
 */
export const MOCK_DIR_NAME = 'mocks';

/**
 * 默认的 mock 数据目录 (其会作为mocks目录的子文件夹名称)
 */
export const MOCK_DATA_DIR_NAME = 'data';

/**
 * 默认的 mihawk 配置
 */
export const DEFAULT_RC: MihawkOptions = {
  host: '0.0.0.0',
  port: 8888,
  https: false,
  cors: true,
  cache: false,
  watch: true,
  mockDir: MOCK_DIR_NAME,
  mockDirPath: path.resolve(CWD, MOCK_DIR_NAME),
  mockDataDirPath: path.resolve(CWD, MOCK_DIR_NAME, MOCK_DATA_DIR_NAME),
  mockDataFileType: 'json',
  mockLogicFileType: 'none',
  autoCreateMockLogicFile: false,
  tsconfigPath: `./${MOCK_DIR_NAME}/tsconfig.json`,
  typescriptMode: false,
  logConfig: null,
};
