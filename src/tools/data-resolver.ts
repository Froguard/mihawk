'use strict';
import { isNumStrict } from '../utils/is';
import { shuffle, randPick } from '../utils/list';

/**
 * 随机挑选一个元素
 * @param {Array} arr
 * @returns {any}
 */
export const pickRand = randPick;

/** 3rd dedupe list */
export { default as dedupe } from 'free-dedupe';

/** 3rd deepmerge obj */
export { default as deepmerge } from 'deepmerge';

/**
 * 随机打乱一个数组，并返回一个新的数组
 * @param {T[]} arr
 * @returns {T[]} 新的数组
 */
export const shuffleList = shuffle;

/**
 * 随机打散一个字符串中的所有字符，并返回一个新字符串
 * @param {string} str
 * @returns {string} newStr
 */
export function shuffleString(str: string) {
  return shuffleList<string>(str.split('')).join('');
}

/**
 * 获取分页数据
 * @param {T[]} list
 * @param {object} options
 * @param {number} options.index 页码
 * @param {number} options.size 每页数量
 * @returns {T[]} 分页后的数据（新数组）
 */
export function getListByPagination<T = any>(list: T[], options: { index: number; size: number }) {
  let { index, size } = options || {};
  index = isNumStrict(index) && index > 0 ? index : 1;
  size = isNumStrict(size) && size >= 2 ? size : 10;
  //
  const start = (index - 1) * size;
  const end = index * size;
  //
  return list.slice(start, end);
}
