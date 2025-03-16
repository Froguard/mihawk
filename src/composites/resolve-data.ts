'use strict';
import { join } from 'path';
import Colors from 'color-cc';
import { existsSync } from 'fs-extra';
import deepMerge from 'deepmerge';
import { writeJSONSafeSync } from '../utils/file';
import { Printer, Debugger } from '../utils/print';
import { absifyPath, formatPath, formatMockPath } from '../utils/path';
import { loadJS, loadJson, loadTS } from '../composites/loader';
import { isObjStrict } from '../utils/is';
import { LOG_ARROW, MOCK_DATA_DIR_NAME, LOG_FLAG } from '../consts';
import { createReadonlyProxy } from '../utils/obj';
import { jsonRequest } from '../utils/request';
import { initMockLogicFile } from './init-file';
import type { RequestInit, BodyInit } from 'node-fetch'; // @^2.6.11
import type { BaseRequestEx, KoaContext, MihawkOptions, MockDataConvertor } from '../com-types';

// only for log
const RESOLVER_NAME = '[resolver]';
const LOGFLAG_RESOLVER = `${Colors.cyan(RESOLVER_NAME)}${Colors.gray(':')}`;

/**
 * 创建数据解析器
 * @param {MihawkOptions} options
 * @returns
 */
export function createDataResolver(options: MihawkOptions) {
  const {
    mockDir,
    cache, //
    useLogicFile,
    isTypesctiptMode,
    mockDataDirPath: MOCK_DATA_DIR_PATH,
    dataFileExt: JSON_EXT,
    logicFileExt: LOGIC_EXT,
    autoCreateMockLogicFile = false,
    initJsonByRemote,
  } = options || {};
  // load convert-function logic file
  const loadConvertLogicFile = isTypesctiptMode ? loadTS<MockDataConvertor> : loadJS<MockDataConvertor>;
  const DATA_BASE_PATH = formatPath(join(mockDir, MOCK_DATA_DIR_NAME));
  /**
   * 执行 mock
   * @param mockKey mock 文件路径 (无后缀)
   */
  return async function getMockData(ctx: KoaContext) {
    const { disableLogPrint, mockRelPath, routePath } = ctx || {};
    /**
     * 【警告】这里必须得依据 mockRelPath 值来决定查找那个 mock 文件来进行如何处理
     * （因为前面的 routes.ts 中间件中，会根据 routes.json 文件中的 kv 匹配进行重定向）
     */
    // 0.format mock path
    const mockRelPathNoExt = formatMockPath(mockRelPath);
    !disableLogPrint && Printer.log(LOGFLAG_RESOLVER, `${Colors.cyan(routePath)} ${LOG_ARROW} ${Colors.green(`./${mockRelPathNoExt}`)}`);

    // 1.load mock data from json|json5 file
    const jsonPath = `${mockRelPathNoExt}.${JSON_EXT}`;
    const jsonPath4log = `${DATA_BASE_PATH}/${jsonPath}`; // only for log
    const mockJsonAbsPath = absifyPath(join(MOCK_DATA_DIR_PATH, jsonPath));
    // 确保每次初始化的 initData 都是新声明定义并赋值的，方式多次访问时出现逻辑混乱
    const initData = { code: 200, data: 'Empty data', msg: `Auto init file: ${jsonPath4log}` };
    let mockJson: Record<string, any> = initData;
    if (existsSync(mockJsonAbsPath)) {
      let jsonData = await loadJson(mockJsonAbsPath, { noCache: !cache });
      if (jsonData && typeof jsonData === 'object') {
        // 不开启缓存时，每次都会保证返回的时 json 里边的数据（这里使用 deepMerge 做一次通过拷贝创建副本的操作，防止老 json 数据被修改）
        jsonData = cache ? jsonData : deepMerge({}, jsonData);
      } else {
        Printer.warn(LOGFLAG_RESOLVER, Colors.yellow(`MockDataFile isn't a normal json file!`), Colors.gray(jsonPath4log), Colors.yellow('Unexception value='), jsonData);
      }
      // 采用备份形式
      mockJson = jsonData || initData;
    } else {
      let finalInitData: Record<string, any> = initData;
      let finalInitType = 'default';
      // Try fetch from remote if enabled
      let remoteData: Record<string, any> | null = null;
      if (typeof initJsonByRemote === 'object' && initJsonByRemote?.enable) {
        const { method, headers, request } = ctx || {};
        const body = request?.body as BodyInit;
        remoteData = await fetchRemoteData(mockRelPath, { method, headers, body }, options);
      }
      // Use remote data if available, otherwise use default
      if (remoteData) {
        finalInitData = remoteData;
        finalInitType = 'fallbackRemoteData';
      }
      Debugger.log(RESOLVER_NAME, `MockDataFile isn't exists, will auto create it with ${finalInitType}...`, jsonPath4log);
      // Auto create json file
      writeJSONSafeSync(mockJsonAbsPath, finalInitData);
      //
    }
    ctx.set('X-Mock-Use-Default', mockJson === initData ? '1' : '0');

    // 2.convert data by logic file, if it exists & exec correctly
    ctx.set('X-Mock-Use-Logic', 'none');
    if (useLogicFile) {
      const logicPath = `${mockRelPathNoExt}.${LOGIC_EXT}`;
      const logicPath4log = `${DATA_BASE_PATH}/${logicPath}`; // only for log
      const mockLogicAbsPath = join(MOCK_DATA_DIR_PATH, logicPath);
      if (existsSync(mockLogicAbsPath)) {
        // Printer.log(LOGFLAG_RESOLVER, 'LoadLogicFile:', Colors.gray(logicPath4log));
        // get convertor function via loadJS/loadTS
        const dataConvertor = await loadConvertLogicFile(mockLogicAbsPath, { noCache: !cache });
        if (typeof dataConvertor === 'function') {
          const { request } = ctx || {};
          // 定义 extra 方式1: 防止被篡改，进行深度冻结
          // const extra: MhkCvtrExtra = { ...request };
          // deepFreeze(extra);
          // 定义 extra 方式2: 防止被篡改，进行深度代理
          const extra = createReadonlyProxy(request as BaseRequestEx, `${LOG_FLAG} ${Colors.gray('[extra]:')}`);
          try {
            // 执行转换器，处理原始的 json 数据
            mockJson = await dataConvertor(mockJson, extra);
            ctx.set('X-Mock-Use-Logic', LOGIC_EXT);
          } catch (error) {
            Printer.error(LOGFLAG_RESOLVER, Colors.error(`Convert-function of MockLogicFile exec failed!`), Colors.yellow(logicPath4log), '\n', error);
            Printer.log(Colors.yellow(`Will return json (${jsonPath4log}) instead.`));
          }
          if (!isObjStrict(mockJson)) {
            // TODO: mockJson 的检查待优化，这里应该是 isPureObj/isJson 的判断，而不是严格判断 object
            Printer.warn(LOGFLAG_RESOLVER, Colors.yellow("Convert-function of MockLogicFile, isn't return an json-object!"), Colors.gray(logicPath4log));
          }
        } else {
          const exportInfo = isTypesctiptMode ? 'export default' : 'module.exports';
          Printer.warn(LOGFLAG_RESOLVER, Colors.yellow(`MockLogicFile isn't ${exportInfo} a convert-function!`), Colors.gray(logicPath4log));
        }
      } else {
        if (autoCreateMockLogicFile) {
          Printer.warn(LOGFLAG_RESOLVER, "MockLogicFile isn't exists, will auto ctreate it...", Colors.gray(logicPath4log));
          // ★ Auto create logic file
          initMockLogicFile(mockLogicAbsPath, { routePath, jsonPath4log, logicPath4log, logicFileExt: LOGIC_EXT, overwrite: false });
          //
        } else {
          Printer.warn(LOGFLAG_RESOLVER, Colors.yellow("MockLogicFile isn't exists!"), Colors.gray(logicPath4log));
        }
      }
    }
    //
    return mockJson;
  };
}

/**
 * 从远端获取 json 数据内容（该内容会用于初始化 mock 时候所需要的 json 文件）
 * @param {string} reqPath
 * @param {RequestInit} reqOptions
 * @param {MihawkOptions} mhkOptions
 * @returns {Promise<JSONObject | null>}s
 */
async function fetchRemoteData(reqPath: string, reqOptions: RequestInit, mhkOptions: MihawkOptions) {
  const { initJsonByRemote } = mhkOptions;
  if (typeof initJsonByRemote !== 'object') {
    Debugger.log(LOGFLAG_RESOLVER, 'FetchRemoteData: initJsonByRemote isnot a object, will skip remote data fetch!');
    return null;
  }
  if (!initJsonByRemote?.enable) {
    Debugger.log(LOGFLAG_RESOLVER, 'FetchRemoteData: initJsonByRemote.enable != true, will skip remote data fetch!');
    return null;
  }
  if (!initJsonByRemote?.target) {
    Printer.warn(LOGFLAG_RESOLVER, 'FetchRemoteData: initJsonByRemote.target is not defined, will skip remote data fetch!');
    return null;
  }

  try {
    const { target, timeout = 5000, rewrite } = initJsonByRemote;
    if (typeof rewrite === 'function') {
      reqPath = rewrite(reqPath);
    }
    const requestPath = `${target}/${reqPath}`;
    Printer.log(LOGFLAG_RESOLVER, `FetchRemoteData: Fetching remote data from ${Colors.cyan(requestPath)}`);
    const { method = 'GET', headers: originalHeaders = {}, body } = reqOptions || {};
    // 构造透传 headers
    const headers: Record<string, any> = {
      ...originalHeaders,
      'Cache-Control': 'no-cache',
      Accept: 'application/json',
    };
    // delete headers['content-length'];
    // delete headers['authorization'];
    // 执行请求
    const data = await jsonRequest(requestPath, { method, timeout, headers, body });
    if (!isObjStrict(data)) {
      Printer.error(LOGFLAG_RESOLVER, 'FetchRemoteData: Invalid response data format', data);
      return null;
    }
    data.mihawkMessage = `Auto init json data from remote: ${requestPath}`;
    return data;
  } catch (error: any) {
    Printer?.error(LOGFLAG_RESOLVER, 'FetchRemoteData: Remote data fetch failed:', error);
    return null;
  }
}
