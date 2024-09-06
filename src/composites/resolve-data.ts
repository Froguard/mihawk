'use strict';
import { join } from 'path';
import Colors from 'color-cc';
import { existsSync } from 'fs-extra';
import deepmerge from 'deepmerge';
import * as JSON5 from 'json5';
import { writeJSONSafeSync, writeFileSafeSync } from '../utils/file';
import { Printer } from '../utils/print';
import { absifyPath, formatPath, formatMockPath } from '../utils/path';
import { loadJS, loadJson, loadTS } from '../composites/loader';
import { isObjStrict } from '../utils/is-type';
import { MOCK_DATA_DIR_NAME, PKG_NAME } from '../consts';
import type { KoaContext, LoigicFileExt, MihawkOptions, MockDataConvertor } from '../com-types';

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
    !disableLogPrint && Printer.log('MockDataResolver:', `${Colors.cyan(routePath)} -> ${Colors.green(mockRelPathNoExt)}`);

    // 1.load mock data from json|json5 file
    const jsonPath = `${mockRelPathNoExt}.${JSON_EXT}`;
    const jsonPath4log = `${DATA_BASE_PATH}/${jsonPath}`; // only for log
    const mockJsonAbsPath = absifyPath(join(MOCK_DATA_DIR_PATH, jsonPath));
    const initData = { code: 200, data: 'Empty data', msg: `Auto init file: ${jsonPath4log}` };
    let mockJson: Record<string, any> = initData;
    if (existsSync(mockJsonAbsPath)) {
      mockJson = (await loadJson(mockJsonAbsPath, !cache)) || initData;
    } else {
      Printer.warn('MockDataResolver:', `MockDataFile isn't exists, will auto create it...`, Colors.gray(jsonPath4log));
      // auto create json file
      writeJSONSafeSync(mockJsonAbsPath, initData);
    }
    ctx.set('X-Mock-Use-Default', mockJson === initData ? '1' : '0');

    // 2.convert data by logic file, if it exists & exec correctly
    ctx.set('X-Mock-Use-Logic', '0');
    if (useLogicFile) {
      const logicPath = `${mockRelPathNoExt}.${LOGIC_EXT}`;
      const logicPath4log = `${DATA_BASE_PATH}/${logicPath}`; // only for log
      const mockLogicAbsPath = join(MOCK_DATA_DIR_PATH, logicPath);
      if (existsSync(mockLogicAbsPath)) {
        const dataConvertor = await loadLogicFile(mockLogicAbsPath, !cache);
        if (typeof dataConvertor === 'function') {
          mockJson = await dataConvertor(mockJson, { Colors, deepMerge: deepmerge, JSON5 }, ctx);
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
          // auto create logic file
          initMockLogicFile(mockLogicAbsPath, { routePath, mockJsonPath: jsonPath4log, logicFileExt: LOGIC_EXT });
          //
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

function initMockLogicFile(mockLogicFilePath: string, options: { routePath: string; mockJsonPath: string; logicFileExt: LoigicFileExt }) {
  const { logicFileExt, routePath, mockJsonPath } = options;
  if (!logicFileExt) {
    return;
  }
  let initContent: string = '';
  const commentCode = [
    'use strict;',
    '/**', //
    ` * ${routePath}`, //
    ' */',
  ];
  const methodCommentCode = [
    '/**',
    ` * @param {object} originData (${mockJsonPath})`, //
    ' * @param {MkCvtorTools} tools',
    ' * @returns {object} newData',
    ' */',
  ];
  switch (logicFileExt) {
    case 'ts':
      initContent = [
        ...commentCode,
        `import { MkCvtorTools } from "${PKG_NAME}/com-types";`,
        '',
        ...methodCommentCode,
        'export default function (originData: Record<string, any>, tools? MkCvtorTools) {',
        '  // TODO: write your logic here', //
        '  return originData;',
        '};',
      ].join('\n');
      break;
    case 'js':
    case 'cjs':
      initContent = [
        ...commentCode,
        '',
        ...methodCommentCode,
        'module.exports = function (originData, tools) {',
        '  // TODO: write your logic here', //
        '  return originData;',
        '};',
      ].join('\n');
      break;
    default:
      break;
  }
  initContent && writeFileSafeSync(mockLogicFilePath, initContent);
}
