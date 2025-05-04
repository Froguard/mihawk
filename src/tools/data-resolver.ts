'use strict';
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
