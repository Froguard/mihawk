'use strict';
import vm from 'vm';
import path from 'path';
import { transpileModule, ModuleKind, ScriptTarget, type TranspileOptions } from 'typescript';
import { existsSync, readFileSync } from 'fs-extra';
import * as json5 from 'json5';
import Colors from 'color-cc';
import LRUCache from 'lru-cache';
import { CWD } from '../consts';
import { absifyPath, getRootAbsPath, isPathInDir, relPathToCWD, unixifyPath } from '../utils/path';
import { Debugger, Printer } from '../utils/print';
import { isNil } from '../utils/is';
import type { IPackageJson } from 'package-json-type';

const LOGFLAG_LOADER = Colors.cyan('[loader]') + Colors.gray(':');

// 缓存的 json 数据
const _cacheJson = new LRUCache<string, Record<string, any>>({ max: 50 });

interface BaseLoadOption {
  noCache?: boolean;
  noLogPrint?: boolean;
}

/**
 * 加载&执行 json 文件，返回数据
 * @param {string} jsonFilePath
 * @param {BaseLoadOption} options load 配置项
 * @returns {object}
 */
export async function loadJson(jsonFilePath: string, options?: BaseLoadOption) {
  const { noCache = false, noLogPrint = false } = options || {};
  jsonFilePath = absifyPath(jsonFilePath);
  const json = await _loadFileWithCache<Record<string, any>>(jsonFilePath, {
    cacheObj: _cacheJson,
    forceRefresh: noCache,
    noLogPrint,
    resolveData: async JsonStr => {
      let jsonData: Record<string, any> = {};
      try {
        jsonData = JsonStr ? json5.parse(JsonStr) : {};
      } catch (error) {
        Printer.error(LOGFLAG_LOADER, 'Parse json file failed!', Colors.gray(jsonFilePath), '\n', error);
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
 * @param {BaseLoadOption} options load 配置项
 * @returns {Promise<T|null>}
 */
export async function loadJS<T = any>(jsFilePath: string, options?: BaseLoadOption) {
  const { noCache = false, noLogPrint = false } = options || {};
  jsFilePath = absifyPath(jsFilePath);
  if (noCache) {
    // _clearSelfAndAncestorsCache(jsFilePath);
    // _clearRequireCache(jsFilePath);
    refreshTsOrJs(jsFilePath);
  }
  try {
    // @ts-ignore
    const mod = require(jsFilePath); // eslint-disable-line
    !noLogPrint && Printer.log(LOGFLAG_LOADER, `LoadJS${noCache ? Colors.gray('(nocache)') : ''}: ${Colors.gray(unixifyPath(relPathToCWD(jsFilePath)))}`);
    return mod as T;
  } catch (error) {
    Printer.error(LOGFLAG_LOADER, Colors.red('Load js file failed!'), Colors.gray(jsFilePath), '\n', error);
    return null;
  }
}

/**
 * 加载&执行 ts 文件，返回执行结果
 * - 注意，被加载的文件，最好有一个默认导出
 * @param {string} tsFilePath
 * @param {BaseLoadOption} options load 配置项
 * @returns {Promise<T|null>}
 */
export async function loadTS<T = any>(tsFilePath: string, options?: BaseLoadOption) {
  const { noCache = false, noLogPrint = false } = options || {};
  tsFilePath = absifyPath(tsFilePath);
  if (!require.extensions['.ts']) {
    Printer.warn(LOGFLAG_LOADER, Colors.warn('Need to invoke enableRequireTsFile() first before load ts file'));
    return null;
  }
  //
  if (noCache) {
    // _clearSelfAndAncestorsCache(tsFilePath);
    // _clearRequireCache(tsFilePath);
    refreshTsOrJs(tsFilePath);
  }
  try {
    // @ts-ignore
    const mod = require(tsFilePath); // eslint-disable-line
    !noLogPrint && Printer.log(LOGFLAG_LOADER, `LoadTS${noCache ? Colors.gray('(nocache)') : ''}: ${Colors.gray(unixifyPath(relPathToCWD(tsFilePath)))}`);
    const res = mod?.default as T;
    if (isNil(res)) {
      // ts shoul export default
      Printer.warn(LOGFLAG_LOADER, Colors.yellow('ts file should export default, but not found'), res);
    }
    return res;
  } catch (error) {
    Printer.error(LOGFLAG_LOADER, Colors.red('Load ts file failed!'), Colors.gray(tsFilePath), '\n', error);
    return null;
  }
}

/**
 * 刷新 json 文件缓存
 * @param {string} jsonFilePath json文件路径
 * @returns
 */
export function refreshJson(jsonFilePath: string) {
  return _cacheJson.has(jsonFilePath) && _cacheJson.del(jsonFilePath);
}

/**
 * 刷新 js|ts 文件缓存（以便于下次加载的时候，采用最新的文件）
 * @param {string} filePath
 */
export function refreshTsOrJs(filePath: string) {
  return _clearSelfAndAncestorsCache(filePath);
  // return _clearRequireCache(filePath);
}

/**
 * 启用 require ts 文件
 * - 对 require.extensions['.ts'] 封装，以便于能够直接进行 require
 */
export function enableRequireTsFile(tsconfig?: TsConfig) {
  if (!require.extensions['.ts']) {
    require.extensions['.ts'] = _genTsFileRequireHandle(tsconfig || {});
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
  noLogPrint?: boolean;
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
  const { cacheObj, resolveData, forceRefresh = false, noLogPrint = false } = options;
  let cacheData: Data | string | null | undefined = null;
  if (!forceRefresh && cacheObj.has(filePath)) {
    cacheData = cacheObj.get(filePath);
  } else {
    let fileContent: string | null = null;
    const isFileExist = existsSync(filePath);
    try {
      if (isFileExist) {
        fileContent = readFileSync(filePath, 'utf-8');
        !noLogPrint && Printer.log(LOGFLAG_LOADER, `LoadJson${forceRefresh ? Colors.gray('(nocache)') : ''}: ${Colors.gray(unixifyPath(relPathToCWD(filePath)))}`);
      }
    } catch (error) {
      Printer.error(LOGFLAG_LOADER, 'Read file failed!', Colors.gray(filePath), '\n', error);
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
function _genTsFileRequireHandle(tsconfig: TsConfig) {
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
    Debugger.log('jsCode:\n', jsCode, '\n');
    // 方案一：直接 eval或者 new Function（不可取，不安全）
    // module.exports = eval(jsCode);
    // 方案二：使用 vm 沙箱进行执行 jsCode 代码
    // 创建一个执行上下文，继承自 global
    const vmContext = vm.createContext({ ...global });
    vmContext.global = global;
    vmContext.require = require;
    vmContext.module = module;
    vmContext.exports = module.exports;
    vmContext.__dirname = path.dirname(tsFilePath);
    vmContext.__filename = tsFilePath;
    vmContext.console = console;
    vmContext.process = process;
    vmContext.Buffer = Buffer;
    // 执行 jsCode
    vm.runInNewContext(
      // source code
      jsCode,
      // context
      vmContext,
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
 * @private
 * @param {string} filename
 * r@returns {void}
 */
function _clearRequireCache(filename: string) {
  if (CWD === filename || !isPathInDir(filename, CWD)) {
    return;
  }
  Debugger.log('_clearRequireCache:', filename);
  filename = absifyPath(filename);
  const mod = require.cache[filename];
  if (!mod) {
    return;
  }
  const parent = mod?.parent; // 对父对象的获取必须在删除自己之前，否则会报错
  // 1. 删除自己（确保 parent 已经获取到，才删除自己）
  mod.loaded = false;
  delete require.cache[filename];
  Debugger.log('_clearRequireCache: √ clear require.cache success!', filename, 'parent:', parent?.filename);
  // 2. 删除父模块的引用
  if (parent && typeof parent === 'object') {
    try {
      // 2.1. 删除父模块式对自己的引用
      const parentChildList = parent.children;
      if (Array.isArray(parentChildList)) {
        const index = parentChildList.findIndex(item => item.filename === filename);
        if (index > -1) {
          parentChildList.splice(index, 1);
        }
      }
      // 2.2. 删除全局模块上，关于自己的缓存 module.constructor._pathCache
      const pathCache = (module?.constructor as any)?._pathCache;
      if (pathCache && typeof pathCache === 'object') {
        Object.keys(pathCache).forEach(key => {
          if (pathCache[key]?.includes(filename)) {
            delete pathCache[key];
          }
        });
      }
    } catch (error) {
      Printer.error(LOGFLAG_LOADER, 'Clear require.cache failed!', Colors.gray(filename), '\n', error);
    }
  }
}

/**
 * 递归向上做如下的”删除缓存“操作
 * - 1.删除自己对应的缓存
 * - 2.删除父引用模块对应的缓存
 * @param {string} filename
 */
function _clearSelfAndAncestorsCache(filename: string) {
  filename = absifyPath(filename);
  Debugger.log('_clearSelfAndAncestorsCache:', filename);
  const PKG_ROOT = getRootAbsPath();
  if (!(filename === CWD || isPathInDir(filename, CWD) || filename === PKG_ROOT || isPathInDir(filename, PKG_ROOT))) {
    Debugger.log('_clearSelfAndAncestorsCache Skip danger path:', filename);
    return;
  }
  const mod = require.cache[filename];
  if (!mod) {
    Debugger.log('_clearSelfAndAncestorsCache Skip empty cache:', filename);
    return;
  }
  const parent = mod?.parent;
  const parentId = parent?.id;
  // clear self
  _clearRequireCache(filename);
  // clear parent
  parentId && _clearSelfAndAncestorsCache(parentId);
}
