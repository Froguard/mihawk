'use strict';
import vm from 'vm';
import path from 'path';
import { transpileModule, ModuleKind, ScriptTarget, type TranspileOptions } from 'typescript';
import { existsSync, readFileSync } from 'fs-extra';
import * as json5 from 'json5';
import Colors from 'color-cc';
import LRUCache from 'lru-cache';
import { CWD } from '../consts';
import { absifyPath, getRootAbsPath, relPathToCWD } from '../utils/path';
import { Printer, Debugger } from '../utils/print';
import { isObjStrict } from '../utils/is-type';
import type { IPackageJson } from 'package-json-type';

// 缓存的 json 数据
const _cacheJson = new LRUCache<string, Record<string, any>>({ max: 50 });

/**
 * 加载&执行 json 文件，返回数据
 * @param {string} jsonFilePath
 */
export async function loadJson(jsonFilePath: string, noCache = false) {
  jsonFilePath = absifyPath(jsonFilePath);
  const json = await _loadFileWithCache<Record<string, any>>(jsonFilePath, {
    cacheObj: _cacheJson,
    forceRefresh: noCache,
    resolveData: async JsonStr => {
      let jsonData: Record<string, any> = {};
      try {
        jsonData = JsonStr ? json5.parse(JsonStr) : {};
      } catch (error) {
        Printer.error('parse json file failed!', jsonFilePath, error);
        jsonData = {};
      }
      return jsonData;
    },
  });
  return json;
}

/**
 * 加载&执行 js 文件，返回执行结果
 * @param {string} jsFilePath
 * @returns {Promise<T|null>}
 */
export async function loadJS<T = any>(jsFilePath: string, noCache = false) {
  jsFilePath = absifyPath(jsFilePath);
  if (noCache) {
    // clearSelfAndAncestorsCache(jsFilePath);
    clearRequireCache(jsFilePath);
  }
  try {
    // @ts-ignore
    const mod = require(jsFilePath); // eslint-disable-line
    return mod as T;
  } catch (error) {
    Printer.error(Colors.red('load js file failed!'), jsFilePath, error);
    return null;
  }
}

/**
 * 加载&执行 ts 文件，返回执行结果
 * @param {string} tsFilePath
 * @param {LoadTsOptions | boolean} options
 * @returns {Promise<T|null>}
 */
export async function loadTS<T = any>(tsFilePath: string, noCache = false) {
  tsFilePath = absifyPath(tsFilePath);
  if (!require.extensions['.ts']) {
    Printer.warn(Colors.warn('Need to invoke enableRequireTsFile() first before load ts file'));
    return null;
  }
  //
  if (!noCache) {
    // clearSelfAndAncestorsCache(tsFilePath);
    clearRequireCache(tsFilePath);
  }
  try {
    // @ts-ignore
    const mod = require(tsFilePath); // eslint-disable-line
    return mod as T;
  } catch (error) {
    Printer.error(Colors.red('load ts file failed!'), tsFilePath, error);
    return null;
  }
}

/**
 * 启用 require ts 文件
 * - 对 require.extensions['.ts'] 封装，以便于能够直接进行 require
 */
export function enableRequireTsFile(tsconfig?: TsConfig) {
  if (!require.extensions['.ts']) {
    require.extensions['.ts'] = _createTsFileRequireHandle(tsconfig || {});
  }
}

/**
 * 读取本工程根目录下的文件
 * @description
 * 为什么会有本函数？
 * - 因为源码情况下可以直接正常路径进行读取根目录下的文件，但是直接使用相对路径进行 require/import 都会导致在 tsc 之后，将对应被 import 的文件一并打包
 *   - 所以这里以绝对路径方式，进行 import/require 到唯一文件，而不会打包产生新的文件
 * - tsc 之后，打包目录会是以 dist 开头，如 dist/cjs,dist/esm
 *   - 所以，需要先计算出正确的”根目录绝对路径“，然后拼装目标文件路径
 *
 * 详见 getRootAbsPath() 函数的逻辑实现
 *
 * @param {string} relFilePath
 * @returns {Data}
 */
export function loadFileFromRoot<Data = any>(relFilePath: string) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const data = require(path.resolve(getRootAbsPath(), relFilePath));
  return data as Data;
}

/**
 * 读取本工程的 package.json 文件
 * @returns {IPackageJson} package.json 文件内容
 */
export function readPackageJson() {
  return loadFileFromRoot<IPackageJson>('./package.json');
}

//
// ============================================================ private functions ============================================================
//

// 配置
interface LoadWithCacheOptions<Data = any> {
  cacheObj: LRUCache<string, Data | string>;
  resolveData?: (fileContent: string | null) => Promise<Data | null>;
  forceRefresh?: boolean;
}
/**
 * 加载数据，并缓存数据
 * - 优先读取缓存
 * - 如无缓存，则调用 loadFunc 获取最新数据，获取之后会重新甚至到缓存上
 * @private
 * @param {string} filePath
 * @param {LoadWithCacheOptions<Data>} options
 * @param {LRUCache<string, Data>} [options.cacheObj] 缓存对象
 * @param {(key: string) => Promise<Data>} [options.loadFunc] 加载数据的函数
 * @param {boolean} [options.forceRefresh=false] 强制刷新缓存，即使缓存中存在数据
 * @returns {any}
 */
async function _loadFileWithCache<Data = any>(filePath: string, options: LoadWithCacheOptions<Data>) {
  const { cacheObj, resolveData, forceRefresh } = options;
  let cacheData: Data | string | null | undefined = null;
  if (!forceRefresh && cacheObj.has(filePath)) {
    cacheData = cacheObj.get(filePath);
  } else {
    let fileContent: string | null = null;
    const isFileExist = existsSync(filePath);
    try {
      if (isFileExist) {
        fileContent = readFileSync(filePath, 'utf-8');
        Printer.log(`ForceRefresh: Read load from ${Colors.gray(relPathToCWD(filePath))}`);
      }
    } catch (error) {
      Printer.error('read file failed!', filePath, error);
    }
    if (typeof resolveData === 'function') {
      cacheData = await resolveData(fileContent);
    } else {
      cacheData = fileContent;
    }
    cacheData && cacheObj.set(filePath, cacheData);
  }
  return cacheData as Data;
}

type TsConfig = Record<string, any>; // Partial<TranspileOptions>
/**
 * 生成 .ts 文件的 require 处理函数
 * @private
 * @param {TsConfig} tsconfig
 * @returns {function} .ts 文件的 require 处理函数
 */
function _createTsFileRequireHandle(tsconfig: TsConfig) {
  tsconfig = (tsconfig || {}) as Partial<TranspileOptions>;
  const tsTranspileOption: TranspileOptions = {
    // input
    ...tsconfig,
    // override
    compilerOptions: {
      // input
      ...tsconfig.compilerOptions,
      // override
      module: ModuleKind.CommonJS,
      target: ScriptTarget.ES2015,
      moduleResolution: 'node',
      allowSyntheticDefaultImports: true,
      allowJs: true,
      resolveJsonModule: true,
      esModuleInterop: true,
    },
  };
  /**
   * x.ts 的 require 加载器
   * @param {NodeJS.Module} module
   * @param {string} tsFilePath
   * @returns {any}
   */
  return function (module: NodeJS.Module, tsFilePath: string) {
    const tsCode = readFileSync(tsFilePath, 'utf8');
    const result = transpileModule(tsCode, {
      // tsconfig
      ...tsTranspileOption,
      // filename
      fileName: tsFilePath,
    });
    const jsCode = result.outputText;
    // 方案一：直接 eval （不可取）
    // module.exports = eval(jsCode);
    // 方案二：使用 vm 沙箱进行执行 jsCode 代码

    // vm 执行
    vm.runInNewContext(
      // source code
      jsCode,
      // context
      {
        module,
        exports: module.exports,
        require,
      },
      // options
      {
        filename: tsFilePath,
        displayErrors: true,
      },
    );
  };
}

/**
 * 清理 require cache
 * @param {string} filename
 * r@returns {void}
 */
export function clearRequireCache(filename: string) {
  if (CWD === filename) {
    return;
  }
  Printer.log(`Clearing require cache for ${filename}`);
  filename = absifyPath(filename);
  const mod = require.cache[filename];
  const parent = mod?.parent;
  if (parent && isObjStrict(parent)) {
    try {
      // 1. 删除父模块式对自己的引用
      const parentChildList = parent.children;
      if (Array.isArray(parentChildList)) {
        const index = parentChildList.findIndex(item => item.filename === filename);
        if (index > -1) {
          parentChildList.splice(index, 1);
        }
      }
      // 2. 删除自己
      mod.loaded = false;
      delete require.cache[filename];
      // 3. 删除全局模块上，关于自己的缓存 module.constructor._pathCache
      const pathCache = (module?.constructor as any)?._pathCache;
      if (pathCache && isObjStrict(pathCache)) {
        Object.keys(pathCache).forEach(key => {
          if (pathCache[key]?.includes(filename)) {
            delete pathCache[key];
          }
        });
      }
    } catch (error) {
      Printer.error('clear require.cache failed!', filename, error);
    }
  }
}

/**
 * 递归向上删除缓存
 * - 删除自己对应的缓存
 * - 删除父引用模块对应的缓存
 * @param {string} filename
 */
export function clearSelfAndAncestorsCache(filename: string, stopPath = CWD) {
  filename = absifyPath(filename);
  if (filename === CWD || filename === stopPath) {
    return;
  }
  Printer.log('clearSelfAndAncestorsCache:', filename);
  const mod = require.cache[filename];
  const parent = mod?.parent;
  const parentId = parent?.id;
  // clear self
  clearRequireCache(filename);
  // clear parent
  parentId && clearSelfAndAncestorsCache(parentId, stopPath);
}
