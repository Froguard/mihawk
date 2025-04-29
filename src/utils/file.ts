/**
 * 文件操作相关封装：
 * - 1.不导出的成员（类型定义除外），请在命名上保持私有命名风格，以下划线_开头，_xxx
 * - 2.尽可能不互相引用 utils/ 文件夹之下的其他兄弟模块，防止形成循环依赖.
 */
import { isAbsolute, resolve, dirname } from 'path';
import Colors from 'color-cc';
import * as JSON5 from 'json5';
import { type WriteFileOptions, type JsonWriteOptions, writeFileSync, writeJSONSync, existsSync, ensureDirSync, readFileSync } from 'fs-extra';
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

interface ReadFileOptionsObj {
  encoding: BufferEncoding;
  flag?: string | undefined;
}

/**
 * 读文件常规 options
 */
export type ReadFileOptions = ReadFileOptionsObj | BufferEncoding;

/**
 * 安全读取文件的文本内容
 * @param {string} filePath
 * @param {ReadFileOptionsObj} options
 * @returns {string}
 */
export function readFileSafeSync(filePath: string, options?: ReadFileOptionsObj) {
  if (!filePath) {
    return '';
  }
  filePath = isAbsolute(filePath) ? filePath : resolve(CWD, filePath);
  if (!existsSync(filePath)) {
    console.log(Colors.warn(`The target file path is not existed!`), filePath);
    return '';
  }
  let opts: ReadFileOptionsObj = { encoding: 'utf-8' };
  const typeOfOptions = typeof options;
  if (typeOfOptions === 'object' && options !== null) {
    opts = {
      ...opts,
      ...(options as ReadFileOptionsObj),
    };
  }
  if (typeOfOptions === 'string') {
    opts.encoding = options as unknown as BufferEncoding;
  }
  try {
    return readFileSync(filePath, opts);
  } catch (error) {
    console.log(Colors.warn(`Read file error! filePath=${filePath}`), error);
    return '';
  }
}

/**
 * 安全解析 json 文件，并返回 json 对象
 * @param {string} jsonFilePath
 * @param {ReadFileOptions} options
 * @returns {object} json 对象
 */
export function readJsonSafeSync<T = Record<any, any>>(jsonFilePath: string, options?: ReadFileOptions) {
  if (!jsonFilePath) {
    return null;
  }
  //
  let json: Record<string, any> = null;
  //
  jsonFilePath = isAbsolute(jsonFilePath) ? jsonFilePath : resolve(CWD, jsonFilePath);
  if (!existsSync(jsonFilePath)) {
    console.log(Colors.warn(`The target file path is not existed!`), jsonFilePath);
    return json;
  }
  let opts: ReadFileOptionsObj = { encoding: 'utf-8' };
  const typeOfOptions = typeof options;
  if (typeOfOptions === 'object' && options !== null) {
    opts = {
      ...opts,
      ...(options as ReadFileOptionsObj),
    };
  }
  if (typeOfOptions === 'string') {
    opts.encoding = options as BufferEncoding;
  }
  try {
    const content = readFileSync(jsonFilePath, opts);
    json = JSON5.parse(content);
  } catch (error) {
    console.error(Colors.error(`Parse JsonFile Error: ${jsonFilePath}`), error, '\n');
    json = {};
  }
  return json as T;
}
