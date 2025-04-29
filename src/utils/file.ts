/**
 * 文件操作相关封装：
 * - 1.不导出的成员（类型定义除外），请在命名上保持私有命名风格，以下划线_开头，_xxx
 * - 2.尽可能不互相引用 utils/ 文件夹之下的其他兄弟模块，防止形成循环依赖.
 */
import { isAbsolute, resolve, dirname } from 'path';
import { type WriteFileOptions, type JsonWriteOptions, writeFileSync, writeJSONSync, existsSync, ensureDirSync } from 'fs-extra';
import { CWD } from '../consts';

/**
 * 安全写文件，如果其目录不存在，会自动创建
 * @param {string} filePath
 * @param {string} data
 * @param {WriteFileOptions} options
 * @returns {void}
 */
export function writeFileSafeSync(filePath: string, data: string, options?: WriteFileOptions) {
  if (!filePath) {
    return;
  }
  filePath = isAbsolute(filePath) ? filePath : resolve(CWD, filePath);
  const dirPath = dirname(filePath);
  if (!existsSync(dirPath)) {
    ensureDirSync(dirPath);
  }
  options = typeof options === 'string' ? { encoding: options } : options;
  writeFileSync(filePath, data, { encoding: 'utf-8', ...options });
}

/**
 * 安全写 JSON 文件，如果其目录不存在，会自动创建
 * @param {string} jsonFilePath 绝对路径
 * @param {any} obj
 * @param {JsonWriteOptions} options
 * @returns {void}
 */
export function writeJSONSafeSync(jsonFilePath: string, obj: any, options?: JsonWriteOptions) {
  if (!jsonFilePath) {
    return;
  }
  jsonFilePath = isAbsolute(jsonFilePath) ? jsonFilePath : resolve(CWD, jsonFilePath);
  const dirPath = dirname(jsonFilePath);
  if (!existsSync(dirPath)) {
    ensureDirSync(dirPath);
  }
  options = typeof options === 'string' ? { encoding: options } : options;
  writeJSONSync(jsonFilePath, obj, { spaces: 2, encoding: 'utf-8', ...options });
}
