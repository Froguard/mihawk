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
        Printer.log('MockDataResolver:', 'Load logic file:', Colors.gray(logicPath4log));
        // get convertor function via loadJS/loadTS
        const dataConvertor = await loadLogicFile(mockLogicAbsPath, !cache);
        if (typeof dataConvertor === 'function') {
          mockJson = await dataConvertor(ctx, mockJson, { Colors, deepMerge: deepmerge, JSON5 });
          ctx.set('X-Mock-Use-Logic', '1');
          if (isObjStrict(mockJson)) {
            Printer.warn('MockDataResolver:', Colors.yellow("Convert-function of MockLogicFile, isn't return an json-object!"), Colors.gray(logicPath4log));
          }
        } else {
          Printer.warn('MockDataResolver:', Colors.yellow("MockLogicFile isn't export a convert-function!"), Colors.gray(logicPath4log));
        }
      } else {
        if (autoCreateMockLogicFile) {
          Printer.warn('MockDataResolver:', "MockLogicFile isn't exists, will auto ctreate it...", Colors.gray(logicPath4log));
          // ★ Auto create logic file
          _initMockLogicFile(mockLogicAbsPath, { routePath, jsonPath4log, logicPath4log, logicFileExt: LOGIC_EXT, overwrite: false });
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

interface MockLogicFileInitOptions {
  routePath: string;
  logicFileExt: LoigicFileExt;
  logicPath4log: string;
  jsonPath4log: string;
  overwrite?: boolean;
}
/**
 * 创建 mock 逻辑文件
 * @param {string} mockLogicFilePath 目标文件路径
 * @param options
 * @returns {void}
 */
function _initMockLogicFile(mockLogicFilePath: string, options: MockLogicFileInitOptions) {
  mockLogicFilePath = absifyPath(mockLogicFilePath);
  const { logicFileExt, routePath, jsonPath4log, overwrite } = options;
  // check logic file ext empty
  if (!logicFileExt) {
    Printer.warn('Empty logic file ext, skip init logic file.');
    return;
  }
  // check file exists
  if (!overwrite && existsSync(mockLogicFilePath)) {
    Printer.warn('File is already exists, skip init logic file.', Colors.gray(mockLogicFilePath));
    return;
  }
  // generate init-content
  let initContent: string = '';
  const commentCode = [
    'use strict;',
    '/**', //
    ` * ${routePath}`, //
    ' */',
  ];
  const methodCommentCode = [
    '/**',
    ' * @param {KoaContext} ctx koa-context',
    ` * @param {object} originData (${jsonPath4log})`, //
    ' * @param {MhkCvtorTools} tools { Colors, deepMerge, JSON5 }',
    ' * @returns {object} newData',
    ' */',
  ];
  switch (logicFileExt) {
    case 'ts':
      // typescript dode
      initContent = [
        ...commentCode,
        `import { KoaContext, MhkCvtorTools } from "${PKG_NAME}/com-types";`,
        '',
        ...methodCommentCode,
        'export default async function (ctx: KoaContext, originData: any, tools: MhkCvtorTools) {',
        '  // write your logic here', //
        '  return originData;',
        '};',
      ].join('\n');
      break;
    case 'js':
    case 'cjs':
      // commonjs code
      initContent = [
        ...commentCode,
        '',
        ...methodCommentCode,
        'module.exports = async function (ctx, originData, tools) {',
        '  // write your logic here', //
        '  return originData;',
        '};',
      ].join('\n');
      break;
    default:
      break;
  }
  // check initContent
  if (!initContent) {
    Printer.warn('No logic file ext was matched, skip init logic file.', logicFileExt);
    return;
  }
  //
  writeFileSafeSync(mockLogicFilePath, initContent);
}
