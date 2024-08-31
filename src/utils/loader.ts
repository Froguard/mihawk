'use strict';
import * as fsEx from 'fs-extra';
import * as json5 from 'json5';
import LRUCache from 'lru-cache';

// 缓存的 json 数据
const cacheJson = new LRUCache<string, Record<string, any>>({ max: 50 });
// // 缓存的 js 文件的文本内容
// const cacheJsFileCnt = new LRUCache<string, string>({ max: 50 });
// 缓存的 ts 文件的文本内容
const cacheTsFileCnt = new LRUCache<string, string>({ max: 50 });

interface LoadWithCacheOptions<Data = any> {
  cacheObj: LRUCache<string, Data | string>;
  resolveData?: (fileContent: string | null) => Promise<Data | null>;
  forceRefresh?: boolean;
}
/**
 * 加载数据，并缓存数据
 * - 优先读取缓存
 * - 如无缓存，则调用 loadFunc 获取最新数据，获取之后会重新甚至到缓存上
 * @param {string} filePath
 * @param {LoadWithCacheOptions<Data>} options
 * @param {LRUCache<string, Data>} [options.cacheObj] 缓存对象
 * @param {(key: string) => Promise<Data>} [options.loadFunc] 加载数据的函数
 * @param {boolean} [options.forceRefresh=false] 强制刷新缓存，即使缓存中存在数据
 * @returns
 */
async function _loadFileWithCache<Data = any>(filePath: string, options: LoadWithCacheOptions<Data>) {
  const { cacheObj, resolveData, forceRefresh } = options;
  let cacheData: Data | string | null | undefined = null;
  if (!forceRefresh && cacheObj.has(filePath)) {
    cacheData = cacheObj.get(filePath);
  } else {
    let fileContent: string | null = null;
    const isFileExist = await fsEx.exists(filePath);
    try {
      if (isFileExist) {
        fileContent = await fsEx.readFile(filePath, 'utf-8');
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

/**
 * 加载&执行 json 文件，返回数据
 * @param {string} jsonFilePath
 */
export async function loadJson(jsonFilePath: string, noCache = false) {
  const json = await _loadFileWithCache<Record<string, any>>(jsonFilePath, {
    cacheObj: cacheJson,
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
    delete require.cache[jsFilePath];
    // TODO: 删除 cache 时，需要一并删除其对应依赖模块，以及依赖它的父模块的 require.cache 缓存
  }
  // @ts-ignore
  const res = require(jsFilePath); // eslint-disable-line
  return res as T;
}

interface LoadTsOptions {
  noCache?: boolean;
  tsConfig?: Record<string, any>;
}

/**
 * 加载&执行 ts 文件，返回执行结果
 * @param {string} tsFilePath
 * @param {LoadTsOptions | boolean} options
 */
export async function loadTS(tsFilePath: string, options?: LoadTsOptions | boolean) {
  let noCache = false;
  let tsConfig = {};
  if (typeof options === 'boolean') {
    noCache = options;
  } else {
    const { noCache: disCache, tsConfig: tsCfg } = options || {};
    noCache = !!disCache;
    tsConfig = tsCfg || {};
  }
  //
  const tsContent = await _loadFileWithCache<string>(tsFilePath, {
    cacheObj: cacheTsFileCnt,
    forceRefresh: noCache,
    // resolveData: async tsFileContent => tsFileContent,
  });
  console.log('tsContent', tsContent);
  // TODO: 执行 ts 文件内容里的代码
}
