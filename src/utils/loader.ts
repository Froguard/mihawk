'use strict';
import vm from 'vm';
import { transpileModule, ModuleKind, ScriptTarget, type TranspileOptions } from 'typescript';
import { existsSync, readFileSync } from 'fs-extra';
import * as json5 from 'json5';
import Colors from 'color-cc';
import LRUCache from 'lru-cache';

// 缓存的 json 数据
const _cacheJson = new LRUCache<string, Record<string, any>>({ max: 50 });

/**
 * 加载&执行 json 文件，返回数据
 * @param {string} jsonFilePath
 */
export async function loadJson(jsonFilePath: string, noCache = false) {
  const json = await _loadFileWithCache<Record<string, any>>(jsonFilePath, {
    cacheObj: _cacheJson,
    forceRefresh: noCache,
    resolveData: async JsonStr => {
      let jsonData: Record<string, any> = {};
      try {
        jsonData = JsonStr ? json5.parse(JsonStr) : {};
      } catch (error) {
        console.error('parse json file failed!', jsonFilePath, error);
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
 */
export async function loadJS<T = any>(jsFilePath: string, noCache = false) {
  if (noCache) {
    _clearRequireCache(jsFilePath);
  }
  // @ts-ignore
  const res = require(jsFilePath); // eslint-disable-line
  return res as T;
}

/**
 * 加载&执行 ts 文件，返回执行结果
 * @param {string} tsFilePath
 * @param {LoadTsOptions | boolean} options
 */
export async function loadTS(tsFilePath: string, noCache = false) {
  //
  if (!require.extensions['.ts']) {
    console.warn(Colors.warn('Need to invoke enableRequireTsFile() first before load ts file'));
    return null;
  }
  //
  if (!noCache) {
    _clearRequireCache(tsFilePath);
  }
  // @ts-ignore
  return require(tsFilePath); // eslint-disable-line
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
      }
    } catch (error) {
      console.error('read file failed!', filePath, error);
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
function _clearRequireCache(filename: string) {
  delete require.cache[filename];
  // TODO: 删除 cache 时，需要一并删除其对应依赖模块，以及依赖它的父模块的 require.cache 缓存
}
