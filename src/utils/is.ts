'use strict';

/**
 * 获取对象类型
 * - 缺陷：Object.prototype.toString.call(NaN) 的时候，返回的是 number，即其无法准确判断 number
 * - 关于 NaN 的判断，推荐使用 isNaNStrict 函数
 * @param {unknown} obj
 * @returns {string} typeName
 */
export function getType(obj: unknown) {
  return Object.prototype.toString.call(obj).slice(8, -1).toLowerCase();
}

/**
 * 检查对象类型
 * @param {unknown} obj
 * @param {string} typeName
 * @returns {boolean}
 */
export function isType(obj: unknown, typeName: string) {
  return getType(obj) === typeName?.toLowerCase();
}

/**
 * 判断是否为 null 或 undefined
 * @param {unknown} value
 * @returns
 */
export function isNil(value: unknown): value is null | undefined {
  return value === null || value === undefined;
}
/** alias for isNil */
export const isNullOrUndefined = isNil;
/** alias for isNil */
export const isUndefinedOrNull = isNil;

// 七个 js 官方认定的基础类型（没有 array）
export type PrimitiveType = null | undefined | string | number | boolean | symbol | bigint;
/**
 * 是否为最基础类型
 * @param {unknown} obj
 * @returns {boolean}
 */
export function isPrimitvieType(obj: unknown): obj is PrimitiveType {
  const type = getType(obj);
  return ['bigint', 'boolean', 'null', 'number', 'string', 'symbol', 'undefined'].includes(type as any);
}

export type SimpleJsonPropType = null | string | boolean | number;
/**
 * 检查是否为简单的 json 的值，如 string，number，boolean，null
 * - 常规 json 值，不含 undefined
 * @param {unique} obj
 * @returns {boolean}
 */
export function isSimpleJsonPropType(obj: unknown): obj is SimpleJsonPropType {
  const type = getType(obj);
  if (['null', 'string', 'boolean', 'number'].includes(type as any)) {
    return true;
  }
  return false; //
}

/**
 * 严格判断数字，会对 NaN 敏感，不会判定其为数字
 * @param {unknown} n
 * @returns {boolean}
 */
export function isNumStrict(n: unknown): n is number {
  return !isNaNStrict(n) && isType(n, 'number');
}

/**
 * 严格判断 NaN 这种数据
 * 【⚠️注意】为什么要自己实现，直接用原生 isNaN 不行吗？
 *  不行！因为
 * - 1. isNaN 会对 class 实例判定为 true
 * - 2. isNaN(undefined) 会被判定为 true
 *  eg:
 *  class A {...}
 *  cosnt a = new A();
 *  isNaN(a); // true 竟然是 true
 * @param obj
 * @returns
 */
export function isNaNStrict(obj: unknown): boolean {
  return obj !== obj;
}

/**
 * 严格判定对象
 * - 排除掉空：undefined
 * - 针对 typeof 操作后返回 ’object‘ 的情况，做如下排除：
 *   - 排除掉 null
 *   - 排除掉特殊对象实例：正则表达式 Regex, 错误 Error，日期 Date 的实例
 *   - 排除掉集合对象实例：Map, Set, WeakMap, WeakSet
 *   - 排除掉TypedArray 实例，如 Uint8Array, Uint16Array, Uint32Array 等特殊数组实例
 *   - 排除掉 Object.prototype.toString.call(obj) 判断后，不是 object 的情况，如自定义的 class 实例
 * - 否则，判定为 false，非对象
 * @param {unknown} obj
 * @returns {boolean}
 */
export function isObjStrict(obj: unknown): obj is NonNullable<Record<string, any>> {
  if (isNil(obj)) return false;
  if (typeof obj === 'object') {
    if (Array.isArray(obj)) {
      return false;
    } else if (obj instanceof RegExp || obj instanceof Date || obj instanceof Error) {
      return false;
    } else if (obj instanceof Map || obj instanceof Set || obj instanceof WeakMap || obj instanceof WeakSet) {
      return false;
    } else if (obj instanceof Uint8Array || obj instanceof Uint16Array || obj instanceof Uint32Array) {
      return false;
    } else {
      return isType(obj, 'object'); // use Object.prototype.toString.call(obj) 方式去判断;
      // return true;
    }
  }
  return false;
}

// 空对象
export type EmptyObj = Record<string | number | symbol, never>;

/**
 * 是否为空对象
 * @param {unknown} obj
 * @returns {boolean}
 */
export function isEmptyObj(obj: unknown): obj is EmptyObj {
  if (isObjStrict(obj)) {
    return !Object.keys(obj)?.length;
  }
  return false;
}

// 空数组
export type EmptyArr = never[];

/**
 * 检查空数组
 * @param {unknown} arr
 * @returns
 */
export function isEmptyArr(arr: unknown): arr is EmptyArr {
  if (Array.isArray(arr)) {
    return !arr.length;
  }
  return false;
}
// alias
export const isEmptyList = isEmptyArr;
