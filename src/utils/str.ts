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

/**
 * 获取随机 ID 字符串
 * @param {number} len 字符长度
 * @returns {string} id
 */
export function createRandId(len: number = 6) {
  return Math.random().toString(36).substring(2, 2 + len); // prettier-ignore
}

/**
 * 生成随机颜色
 * @returns {string} #xxx | #xxxxxx
 * @example
 * const color1 = `#${createRandColor()}`; // #xxxxxx
 * const color2 = `#${createRandColor(true)}`; // #xxx
 */
export function createRandColor(short?: boolean) {
  let SEED = 0xffffff;
  let LEN = 6;
  if (short) {
    SEED = 0xfff;
    LEN = 3;
  }
  const hexStr = Math.ceil(Math.random() * SEED).toString(16);
  return `${'f'.repeat(LEN - hexStr.length)}${hexStr}`; // 确保产生的内容是 6 位长度
}

/**
 * 生成随机图地址
 * @param {object} options
 * @returns {string} img src addr
 */
export function createRandImage(options?: { width?: number; height?: number; query?: Record<string, any> }) {
  const { width, height, query = {} } = options || {};
  const qs = Object.entries(query)
    .map(([k, v]) => `${k}=${v}`)
    .join('&');
  return `https://picsum.photos/${width || 100}/${height || 100}?${qs}`;
}

export const RAW_CHARS = '_0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz'; //[_0-9A-Za-z]

/**
 * 获取随机内容的字符串，范围限定在 charsLimit 中
 * @param {number} len 长度
 * @param {string} charsLimit 范围，即由字符组成的字符串，如 'abc'
 * @returns
 */
function _createRandStrLimit(len: number, charsLimit: string) {
  len = len || 1;
  charsLimit = charsLimit?.length ? charsLimit : RAW_CHARS;
  const res: string[] = [];
  let i = 0, n = 0; // prettier-ignore
  for (i = 0; i < len; ++i) {
    n = Math.floor(Math.random() * charsLimit.length);
    res.push(charsLimit.charAt(n));
  }
  return res.join('');
}

/**
 * 获取随机内容的字符串
 * @param {number} len
 * @returns {string} 指定长度的字符串
 */
export function createRandStr(len: number = 1) {
  return _createRandStrLimit(len, RAW_CHARS);
}

/**
 * 获取一个随机字符
 * @returns {char}
 */
export function createRandChar() {
  return createRandStr(1);
}

/**
 * 生成随机 email 地址
 * - 粗略生成，如需更佳效果，请直接使用 mockjs
 * @returns {string}
 */
export function createRandEmail() {
  const nameLen = 5 + Math.ceil(Math.random() * 10); // 5-15
  const domains = ['gmail', 'yahoo', 'hotmail', 'qq', '163', '126', 'sina', 'outlook', 'live', 'icloud', 'apple'];
  return `${createRandStr(nameLen)}@${domains[Math.floor(Math.random() * domains.length)]}.com`;
}

/**
 * 生成随机手机号
 * - 粗略生成，如需更佳效果，请直接使用 mockjs
 * @returns {string}
 */
export function createRandPhone() {
  // 中国大陆手机号有效号段前缀
  const validPrefixes = [
    130, 131, 132, 133, 134, 135, 136, 137, 138, 139, 145, 147, 149, 150, 151, 152, 153, 155, 156, 157, 158, 159, 165, 166, 167, 168, 169, 170, 171, 172, 173, 174, 175, 176, 177,
    178, 179, 180, 181, 182, 183, 184, 185, 186, 187, 188, 189, 191, 192, 193, 195, 196, 197, 198, 199,
  ];
  // 随机选择号段前缀
  const prefix = validPrefixes[Math.floor(Math.random() * validPrefixes.length)];
  // 生成后8位随机数字
  let suffix = '';
  for (let i = 0; i < 8; i++) {
    suffix += Math.floor(Math.random() * 10);
  }

  return `${prefix}${suffix}`;
}
