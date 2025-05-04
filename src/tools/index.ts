'use strict';
/**
 * Only for outer usage
 *
 * @example
 *   import { isNil } from 'mihawk/tools'; *
 *   console.log(isNill(null)); // true
 */

/** mock data creator */
export {
  creataRandBool,
  createRandNum,
  createRandChar,
  createRandStr,
  createRandDate,
  createRandDateStr,
  //
  createUUID,
  createRandId,
  createRandUrl,
  createRandPhone,
  createRandEmail,
  createRandColor,
  createRandImage,
  createRandIp,
} from './data-creator';

/** mock data convertor */
export { shuffleList, shuffleString, pickRand, dedupe, deepmerge } from './data-resolver';

/** var type detect */
export { getType, isType, isNil, isPrimitvieType, isSimpleJsonPropType, isJsonStr, isNumStrict, isNaNStrict, isObjStrict, isEmptyObj, isEmptyArr } from '../utils/is';
/** alias for type detect functions */
export { isNullOrUndefined, isUndefinedOrNull, isEmptyList } from '../utils/is';
/** ts-type-define for var type detect */
export type { EmptyObj, EmptyArr, SimpleJsonPropType, PrimitiveType } from '../utils/is';

/** date */
export { dateFormat, ensureDate, getTimeNowStr } from '../utils/date';
/** ts-type-define for date */
export type { LooseDate } from '../utils/date';

/** obj */
export { delNillProps, deepFreeze } from '../utils/obj';

/** str */
export { fuzzyIncludes, shallowEqual, isMatchPatterns, formatPatterns, delAddrProtocol } from '../utils/str';

/** number */
export { getSafeNum } from '../utils/num';
/** ts-type-define for num */
export type { LooseNum, NumberRange } from '../utils/num';

/** async */
export { sleep, timeoutPromise } from '../utils/async';

/** path */
export { formatPath, isExistedSync, absifyPath, unixifyPath, relPathToCWD } from '../utils/path';

/** file */
export { readFileSafeSync, readJsonSafeSync, writeFileSafeSync, writeJSONSafeSync } from '../utils/file';
/** ts-type-define for file */
export type { ReadFileOptions } from '../utils/file';

/** request */
export { jsonRequest } from '../utils/request';

/** parser */
export { parseStompMsg } from '../utils/parser';

/** printer */
export { Printer } from '../utils/print';

/** net */
export { supportLocalHost, isPortInUse, isLocalHost, getMyIp, detectPort } from '../utils/net';

/** server */
export { getPortByServer, getAddressByServer, getAddrInfoByServer } from '../utils/server';

/** 3rd-Colors(Terminal Colorful Text) */
export { default as Colors } from 'color-cc';
