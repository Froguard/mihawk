'use strict';
import anyMatch from 'anymatch';

/**
 * 模糊包含
 * @param {Array<string>} list
 * @param {string} target
 * @return {boolean}
 * @example
 *   fuzzyIncludes([ 'asdadaAAA', 'xczxcBBB' ], 'asdadaAAA') // true 全字匹配
 *   fuzzyIncludes([ 'asdadaAAA', 'xczxcBBB' ], 'xczxcBBB') // true 全字匹配
 *   fuzzyIncludes([ 'asdadaAAA', 'xczxcBBB' ], 'AAA') // true 子项匹配
 *   fuzzyIncludes([ 'asdadaAAA', 'xczxcBBB' ], 'BBB') // true 子项匹配
 */
export function fuzzyIncludes(list: string[], target: string) {
  if (list.includes(target)) {
    return true;
  }
  return list.some(it => it.includes(target));
}

/**
 * 宽松比较字符串（忽略大小写）
 * @private
 * @param {string} str1
 * @param {string} str2
 * @returns {boolean}
 * @example
 *   shallowEqual('abc', 'abc') // true
 *   shallowEqual('abc', 'ABC') // true
 *   shallowEqual('abc', 'Bcd') // false
 */
export function shallowEqual(str1: string, str2: string) {
  if (str1 === str2) {
    return true;
  } else {
    const s1 = str1.trim();
    const s2 = str2.trim();
    return s1 === s2 || s1.toLowerCase() === s2.toLowerCase();
  }
}

/**
 * target 是否命中 glob 表达式
 * @param {string} target
 * @param {string[]} patterns “glob表达式字符串”，所组成的数组
 * @returns {boolean}
 * @example
 * const isMatched = isMatchPatterns('a/b/c/d/e', ['a/b/c/d/e', 'a/b/c/d/*', 'a/b/c/*', 'a/b/*', 'a/*', '*']); // true
 */
export function isMatchPatterns(target: string, patterns: string[] | string) {
  if (typeof patterns === 'string') {
    patterns = [patterns];
  }
  patterns = formatPatterns(patterns);
  if (!patterns?.length) {
    return false;
  }
  return anyMatch(patterns, target);
}

/**
 * 格式化过滤器数组
 * @param {any[]} filters
 * @returns {string[]}
 */
export function formatPatterns(filters: any[]) {
  return filters && Array.isArray(filters) ? filters.filter(flt => !!flt).map(flt => (typeof flt !== 'string' ? String(flt) : flt)) : [];
}

/**
 * 删除地址的协议头
 * @param address
 * @returns {string} 删除了协议头（https:// 或 http:// 或 file://）的地址
 */
export function delAddrProtocol(address: string) {
  return (
    address
      ?.replace(/^(https?:\/\/)/, '') // http:// https://
      .replace(/^(file:\/\/)/, '') // file://
      .replace(/\/+$/, '') || ''
  );
}
