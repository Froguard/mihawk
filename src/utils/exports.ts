'use strict';
/**
 * Only for outer usage
 * @example
 *
 *   import { isNil } from 'mihawk/utils/exports';
 *
 *   console.log(isNill(null)); // true
 */

/** var type detect */
export { getType, isType, isNil, isPrimitvieType, isSimpleJsonPropType, isNumStrict, isNaNStrict, isObjStrict, isEmptyObj, isEmptyArr } from './is';
/** alias for type detect functions */
export { isNullOrUndefined, isUndefinedOrNull, isEmptyList } from './is';
/** ts-type-define for var type detect */
export type { EmptyObj, EmptyArr, SimpleJsonPropType, PrimitiveType } from './is';

/** date */
export { dateFormat, getTimeNowStr, ensureDate } from './date';
/** ts-type-define for date */
export type { LooseDate } from './date';

/** obj */
export { delNillProps, deepFreeze } from './obj';

/** str */
export { fuzzyIncludes, shallowEqual, isMatchPatterns, formatPatterns, createRandId, delAddrProtocol } from './str';

/** number */
export { getSafeNum } from './num';
/** ts-type-define for date */
export type { LooseNum, NumberRange } from './num';

/** async */
export { sleep, timeoutPromise } from './async';

/** path */
export { formatPath, isExistedSync, absifyPath, unixifyPath, relPathToCWD } from './path';

/** file */
export { readFileSafeSync, readJsonSafeSync, writeFileSafeSync, writeJSONSafeSync } from './file';
/** ts-type-define for file */
export type { ReadFileOptions } from './file';

/** request */
export { jsonRequest } from './request';

/** parser */
export { parseStompMsg } from './parser';

/** printer */
export { Printer } from './print';

/** net */
export { supportLocalHost, isPortInUse, isLocalHost, getMyIp, detectPort } from './net';

/** server */
export { getPortByServer, getAddressByServer, getAddrInfoByServer } from './server';

/** 3rd-list */
export { default as dedupe } from 'free-dedupe';

/** 3rd-deepmerge */
export { default as deepmerge } from 'deepmerge';

/** 3rd-Colors */
export { default as Colors } from 'color-cc';
