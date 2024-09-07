'use strict';
import { join } from 'path';
import Colors from 'color-cc';
import { existsSync } from 'fs-extra';
import { writeJSONSafeSync } from '../utils/file';
import { Printer, Debugger } from '../utils/print';
import { absifyPath, formatPath, formatMockPath } from '../utils/path';
import { loadJS, loadJson, loadTS } from '../composites/loader';
import { isObjStrict } from '../utils/is';
import { MOCK_DATA_DIR_NAME } from '../consts';
import { initMockLogicFile } from './init-file';
import type { KoaContext, MihawkOptions, MockDataConvertor } from '../com-types';

// only for log
const RESOLVER_NAME = '[MockDataResolver]';
const LOGFLAG_RESOLVER = `${Colors.cyan(RESOLVER_NAME)}${Colors.gray(':')}`;

/**
 *
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
  } = options || {};
  const loadLogicFile = isTypesctiptMode ? loadTS<MockDataConvertor> : loadJS<MockDataConvertor>;
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
    !disableLogPrint && Printer.log(LOGFLAG_RESOLVER, `${Colors.cyan(routePath)} -> ${Colors.green(mockRelPathNoExt)}`);

    // 1.load mock data from json|json5 file
    const jsonPath = `${mockRelPathNoExt}.${JSON_EXT}`;
    const jsonPath4log = `${DATA_BASE_PATH}/${jsonPath}`; // only for log
    const mockJsonAbsPath = absifyPath(join(MOCK_DATA_DIR_PATH, jsonPath));
    const initData = { code: 200, data: 'Empty data', msg: `Auto init file: ${jsonPath4log}` };
    let mockJson: Record<string, any> = initData;
    if (existsSync(mockJsonAbsPath)) {
      mockJson = (await loadJson(mockJsonAbsPath, !cache)) || initData;
    } else {
      Debugger.log('[MockDataResolver]:', `MockDataFile isn't exists, will auto create it...`, Colors.gray(jsonPath4log));
      // ★ Auto create json file
      writeJSONSafeSync(mockJsonAbsPath, initData);
      //
    }
    ctx.set('X-Mock-Use-Default', mockJson === initData ? '1' : '0');

    // 2.convert data by logic file, if it exists & exec correctly
    ctx.set('X-Mock-Use-Logic', '0');
    if (useLogicFile) {
      const logicPath = `${mockRelPathNoExt}.${LOGIC_EXT}`;
      const logicPath4log = `${DATA_BASE_PATH}/${logicPath}`; // only for log
      const mockLogicAbsPath = join(MOCK_DATA_DIR_PATH, logicPath);
      if (existsSync(mockLogicAbsPath)) {
        // Printer.log(LOGFLAG_RESOLVER, 'LoadLogicFile:', Colors.gray(logicPath4log));
        // get convertor function via loadJS/loadTS
        const dataConvertor = await loadLogicFile(mockLogicAbsPath, !cache);
        if (typeof dataConvertor === 'function') {
          mockJson = await dataConvertor(mockJson, {
            url: ctx.url,
            method: ctx.method,
            path: ctx.path,
            host: ctx.host,
            headers: ctx.headers,
            params: ctx.params,
            query: ctx.query,
            body: ctx.request.body,
          });
          ctx.set('X-Mock-Use-Logic', '1');
          if (!isObjStrict(mockJson)) {
            Printer.warn(RESOLVER_NAME, Colors.yellow("Convert-function of MockLogicFile, isn't return an json-object!"), Colors.gray(logicPath4log));
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
