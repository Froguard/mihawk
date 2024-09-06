'use strict';
import { join } from 'path';
import Colors from 'color-cc';
import { existsSync } from 'fs-extra';
import { writeJSONSafeSync, writeFileSafeSync } from '../utils/file';
import { Printer } from '../utils/print';
import { absifyPath, formatPath, removeSpecialExt } from '../utils/path';
import { loadJS, loadJson, loadTS } from '../composites/loader';
import { isObjStrict } from '../utils/is-type';
import { MOCK_DATA_DIR_NAME } from '../consts';
import type { KoaContext, MihawkOptions, MockDataConvertor } from '../com-types';

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
    const mockRelPathNoExt = _formatMockPath(mockRelPath);
    !disableLogPrint && Printer.log('MockDataResolver:', `${Colors.cyan(routePath)} -> ${Colors.green(mockRelPathNoExt)}`);

    // 1.load mock data from json|json5 file
    const jsonPath = `${mockRelPathNoExt}.${JSON_EXT}`;
    const jsonPath4log = `${DATA_BASE_PATH}/${jsonPath}`; // only for log
    const mockJsonAbsPath = absifyPath(join(MOCK_DATA_DIR_PATH, jsonPath));
    const defaultData = { code: 200, data: 'Empty json data', msg: `Load mock jsonfile failed! ${jsonPath4log}` };
    let mockJson: Record<string, any> = defaultData;
    if (existsSync(mockJsonAbsPath)) {
      mockJson = (await loadJson(mockJsonAbsPath, !cache)) || defaultData;
    } else {
      Printer.warn('MockDataResolver:', `MockDataFile isn't exists, will auto create it...`, Colors.gray(jsonPath4log));
      // auto create json file
      writeJSONSafeSync(mockJsonAbsPath, defaultData, { spaces: 2, encoding: 'utf-8' });
    }
    ctx.set('X-Mock-Use-Default', mockJson === defaultData ? '1' : '0');
    ctx.set('X-Mock-Use-Logic', '0');

    // 2.convert data by logic file, if it exists & exec correctly
    if (useLogicFile) {
      const logicPath = `${mockRelPathNoExt}.${LOGIC_EXT}`;
      const logicPath4log = `${DATA_BASE_PATH}/${logicPath}`; // only for log
      const mockLogicAbsPath = join(MOCK_DATA_DIR_PATH, logicPath);
      if (existsSync(mockLogicAbsPath)) {
        const dataConvertor = await loadLogicFile(mockLogicAbsPath, !cache);
        if (typeof dataConvertor === 'function') {
          mockJson = await dataConvertor(ctx, mockJson);
          ctx.set('X-Mock-Use-Logic', '1');
          if (isObjStrict(mockJson)) {
            Printer.warn('MockDataResolver:', Colors.yellow("convertor-function of MockLogicFile, isn't return an json-object!"), Colors.gray(logicPath4log));
          }
        } else {
          Printer.warn('MockDataResolver:', Colors.yellow("MockLogicFile isn't export a convertor-function!"), Colors.gray(logicPath4log));
        }
      } else {
        if (autoCreateMockLogicFile) {
          Printer.warn('MockDataResolver:', "MockLogicFile isn't exists, will auto ctreate it...", Colors.gray(logicPath4log));
          // TODO: auto create logic file
        } else {
          Printer.warn('MockDataResolver:', Colors.yellow("MockLogicFile isn't exists!"), Colors.gray(logicPath4log));
        }
      }
    }
    //
    return mockJson;
  };
}

//
//
// ============================================= private functions ===================================================
//
//

/**
 * 格式化 mock 路径
 * - 对于 `/test/a/b`，会返回 `/test/a/b`
 * - 对于 `/test/a/b.xxx`，会返回 `/test/a/b`
 * - 对于 `/test/a/b.json5`，会返回 `/test/a/b`
 * - 对于 `/test/a/`，会返回 `/test/a/index` 【这里特别注意】
 * @private
 * @param mockPath
 * @returns
 */
function _formatMockPath(mockPath: string) {
  let newPath = formatPath(removeSpecialExt(mockPath));
  newPath = newPath.endsWith('/') ? `${newPath}index` : newPath;
  return newPath;
}
