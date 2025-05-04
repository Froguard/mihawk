'use strict';

/**
 * 随机打乱一个数组，并返回一个新的数组
 * @param {T[]} arr
 * @returns {T[]} 新的数组
 */
export function shuffle<T = any>(arr: T[]) {
  return arr.sort(() => [-1, 0, 1][Math.floor(3 - 3 * Math.random())]);
}

/**
 * 随机挑选一个元素
 * @param {Array} arr
 * @returns {any}
 */
export function randPick<T = any>(arr: T[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}
