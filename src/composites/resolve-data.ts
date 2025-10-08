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
import { LOG_ARROW, MOCK_DATA_DIR_NAME } from '../consts';
import { jsonRequest } from '../utils/request';
import { initMockLogicFile } from './init-file';
import type { MhkCvtrExtra, KoaContext, MihawkOptions, MockDataConvertor } from '../com-types';

// only for log
const RESOLVER_NAME = '[resolver]';
const LOGFLAG_RESOLVER = `${Colors.cyan(RESOLVER_NAME)}${Colors.gray(':')}`;

/**
 * 创建数据解析器
 * @param {MihawkOptions} options
 * @returns {asyncFunction}
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
    setJsonByRemote,
    useRemoteData,
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
    const initData = {
      code: 200, // status: 200,
      // success: true,
      data: 'Empty data!',
      msg: `Auto init file: ${jsonPath4log}`,
    };
    let mockJson: Record<string, any> = initData;
    let loadRemote: boolean = false;
    const { method, url, headers, request } = ctx || {};
    const body = request?.body;
    const apiPath = url; // url=/a/b/c?x=1&y=2&z=3 (相对于path，其包含querystring)
    if (existsSync(mockJsonAbsPath)) {
      let jsonData: Record<string, any> | null = null;
      // 针对已经存在本地 json 文件的情况，根据配置中是否开启了 setJsonByRemote.coverExistedJson 去决定要不要从远端拉去数据之后对其进行覆盖
      if (useRemoteData && setJsonByRemote?.coverExistedJson) {
        // 🚀 send remote api
        const remoteData = await fetchRemoteData(apiPath, { method, headers, body }, options);
        if (isObjStrict(remoteData)) {
          // 只有当拉取到的远端数据是正常数据时，才会更新到文件
          writeJSONSafeSync(mockJsonAbsPath, remoteData);
          jsonData = remoteData;
          loadRemote = true;
        } else {
          Printer.warn(LOGFLAG_RESOLVER, Colors.yellow(`RemoteData isn't a normal json response!`), Colors.yellow('Unexception value='), remoteData);
          jsonData = null;
        }
      }
      if (!jsonData) {
        loadRemote = false;
        // 如果上述拉取远端数据，没有成功：如拉取失败、或者未执行拉取（即：未开启远端覆盖）；则执行本地文件读取
        jsonData = await loadJson(mockJsonAbsPath, { noCache: !cache });
      }
      if (isObjStrict(jsonData)) {
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
      if (useRemoteData) {
        // 🚀 send remote api
        remoteData = await fetchRemoteData(apiPath, { method, headers, body }, options);
      }
      // Use remote data if available, otherwise use default
      if (remoteData) {
        loadRemote = true;
        finalInitData = remoteData;
        finalInitType = 'fallbackRemoteData';
      }
      Debugger.log(RESOLVER_NAME, `MockDataFile isn't exists, will auto create it with ${finalInitType}...`, jsonPath4log);
      // Auto create json file
      writeJSONSafeSync(mockJsonAbsPath, finalInitData);
      //
    }
    ctx.set('X-Mock-Use-Remote', loadRemote ? '1' : '0');
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
          // 定义 extra 方式1: 直接访问
          const extra = request as MhkCvtrExtra;
          // MARK: ↓ 这里暂时不加，有点画蛇添足
          // deepFreeze(extra); // 不可以改变 request 的对象属性
          // MARK: ↓ 目前这种方式会报错，比如使用 extra.query（即 ctx.request.query） 的时候会报错
          // 定义 extra 方式2: 防止被篡改，进行深度代理
          // const extra = createReadonlyProxy(request as BaseRequestEx, `${LOG_FLAG} ${Colors.gray('[extra]:')}`);
          try {
            // 执行转换器，处理原始的 json 数据
            mockJson = await dataConvertor(mockJson, extra);
            ctx.set('X-Mock-Use-Logic', LOGIC_EXT);
          } catch (error) {
            Printer.error(LOGFLAG_RESOLVER, Colors.error(`Convert-function of MockLogicFile exec failed!`), Colors.yellow(logicPath4log), '\n', error);
            Printer.log(Colors.yellow(`Will return json (${jsonPath4log}) instead.`));
          }
          if (!isObjStrict(mockJson)) {
            // MARK: mockJson 的检查待优化，这里应该是 isPureObj/isJson 的判断，而不是“判断严格object”,暂时用这个方案，能满足要求，限制小
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
 * @param {Record<string, any>} reqOptions
 * @param {MihawkOptions} mhkOptions
 * @returns {Promise<JSONObject | null>} json 数据内容 或者 null
 */
async function fetchRemoteData(reqPath: string, reqOptions: Record<string, any>, mhkOptions: MihawkOptions) {
  const { setJsonByRemote } = mhkOptions;
  if (typeof setJsonByRemote !== 'object') {
    Debugger.log(LOGFLAG_RESOLVER, 'FetchRemoteData: setJsonByRemote isnot a object, will skip remote data fetch!');
    return null;
  }
  if (!setJsonByRemote?.enable) {
    Debugger.log(LOGFLAG_RESOLVER, 'FetchRemoteData: setJsonByRemote.enable != true, will skip remote data fetch!');
    return null;
  }
  if (!setJsonByRemote?.target) {
    Printer.warn(LOGFLAG_RESOLVER, 'FetchRemoteData: setJsonByRemote.target is not defined, will skip remote data fetch!');
    return null;
  }

  try {
    const { target, timeout = 10000, changeOrigin, rewrite } = setJsonByRemote;
    // 重置 reqPath 接口地址
    if (typeof rewrite === 'function') {
      reqPath = rewrite(reqPath);
    }
    const requestPath = `${target}/${reqPath.replace(/^[/]+/g, '')}`;
    const { method = 'GET', headers: originalHeaders = {}, body } = reqOptions || {};
    // reset reqOptions
    // delete reqOptions.cookies;
    // 构造透传 headers
    const headers: Record<string, any> = {
      ...originalHeaders,
      'Cache-Control': 'no-cache',
      Accept: 'application/json',
      Credentials: 'include',
      Cookie: originalHeaders.cookie || originalHeaders.Cookie || originalHeaders.cookies || originalHeaders.Cookies,
    };
    // 重置 headers['host'] 字段，如果有必要
    const targetUrl = new URL(target);
    const targetHost = targetUrl.host;
    if (changeOrigin && targetHost) {
      headers.Host = targetHost;
      Debugger.log(LOGFLAG_RESOLVER, `Apply changeOrigin: ${Colors.cyan(headers.Host)}`);
    }
    // delete headers['content-length'];
    // delete headers['authorization'];
    // 执行请求
    Printer.log(LOGFLAG_RESOLVER, `FetchRemoteData: Fetching remote data from ${Colors.cyan(requestPath)}`);
    const data = await jsonRequest(requestPath, { method, timeout, headers, body });
    if (isObjStrict(data)) {
      data.mihawkMessage = `Auto init json data from remote: ${requestPath}`;
      return data;
    } else {
      Printer.error(LOGFLAG_RESOLVER, 'FetchRemoteData: Invalid response data format', data);
      return null;
    }
  } catch (error: any) {
    Printer?.error(LOGFLAG_RESOLVER, 'FetchRemoteData: Remote data fetch failed:', error);
    return null;
  }
}
