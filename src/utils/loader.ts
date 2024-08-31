'use strict';
import { existsSync, readFileSync } from 'fs';
import * as json5 from 'json5';
import LRUCache from 'lru-cache';

// 缓存的 json 数据
const cacheJson = new LRUCache<string, Record<string, any>>({ max: 50 });
// // 缓存的 js 文件的文本内容
// const cacheJsFileCnt = new LRUCache<string, string>({ max: 50 });
// 缓存的 ts 文件的文本内容
const cacheTsFileCnt = new LRUCache<string, string>({ max: 50 });

interface LoadWithCacheOptions<Data = any> {
  cacheObj: LRUCache<string, Data>;
  loadFunc: (key: string) => Promise<Data>;
  forceRefresh?: boolean;
}
/**
 * 加载数据，并缓存数据
 * - 优先读取缓存
 * - 如无缓存，则调用 loadFunc 获取最新数据，获取之后会重新甚至到缓存上
 * @param {string} cacheKey
 * @param {LoadWithCacheOptions<Data>} options
 * @param {LRUCache<string, Data>} [options.cacheObj] 缓存对象
 * @param {(key: string) => Promise<Data>} [options.loadFunc] 加载数据的函数
 * @param {boolean} [options.forceRefresh=false] 强制刷新缓存，即使缓存中存在数据
 * @returns
 */
async function _loadWithCache<Data = any>(cacheKey: string, options: LoadWithCacheOptions<Data>) {
  const { cacheObj, loadFunc, forceRefresh } = options;
  let cacheData: Data | null | undefined = null;
  if (!forceRefresh && cacheObj.has(cacheKey)) {
    cacheData = cacheObj.get(cacheKey);
  } else {
    cacheData = await loadFunc(cacheKey);
    cacheData && cacheObj.set(cacheKey, cacheData);
  }
  return cacheData;
}

/**
 * 加载&执行 json 文件，返回数据
 * @param {string} jsonFilePath
 */
export async function loadJson(jsonFilePath: string, noCache = false) {
  const json = await _loadWithCache<Record<string, any>>(jsonFilePath, {
    cacheObj: cacheJson,
    loadFunc: async key => {
      let jsonData: Record<string, any> = {};
      if (existsSync(key)) {
        try {
          const jsonStr = readFileSync(key, 'utf-8');
          jsonData = json5.parse(jsonStr);
        } catch (e) {
          console.error('load & parse json file failed!', e);
        }
      } else {
        console.error(`load json file failed! because file not exists: ${key}`);
      }
      return jsonData;
    },
    forceRefresh: noCache,
  });
  return json;
}

/**
 * 加载&执行 js 文件，返回执行结果
 * @param {string} jsFilePath
 */
export async function loadJS(jsFilePath: string, noCache = false) {
  if (noCache) {
    delete require.cache[jsFilePath];
    // TODO: 删除 cache 时，需要一并删除其对应依赖模块，以及依赖它的父模块的 require.cache 缓存
  }
  // @ts-ignore
  return require(jsFilePath); // eslint-disable-line
}

/**
 * 加载&执行 ts 文件，返回执行结果
 * @param {string} tsFilePath
 */
export async function loadTS(tsFilePath: string, noCache = false) {
  const tsContent = await _loadWithCache<string>(tsFilePath, {
    cacheObj: cacheTsFileCnt,
    loadFunc: async key => {
      let tsCnt = '';
      if (existsSync(key)) {
        try {
          tsCnt = readFileSync(key, 'utf-8');
        } catch (e) {
          console.error('load ts file failed!', e);
        }
      } else {
        console.error(`load ts file failed! because file not exists: ${key}`);
      }
      return tsCnt;
    },
    forceRefresh: noCache,
  });
  console.log('tsContent', tsContent);
  // TODO: 执行 ts 文件内容里的代码
}
