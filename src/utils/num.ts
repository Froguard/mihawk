'use strict';

/**
 * 数字类型可能的值 number | null | undefined
 */
export type LooseNum = number | null | undefined;

// 判断是否为非正常的数字
function _isNillNumber(numLike: LooseNum): numLike is null | undefined {
  return numLike === null || numLike === void 0 || isNaN(numLike);
}
/**
 * 数字范围
 */
export interface NumberRange {
  min: number;
  max: number;
}

/**
 * 获取安全数字
 * @param {number} rawNum
 * @param {NumberRange} numRange
 * @param {number} numRange.min
 * @param {number} numRange.max
 * @returns {number} safeNum
 */
export function getSafeNum(rawNum: number, numRange: Partial<NumberRange>) {
  const { min, max } = numRange || {};
  const MIN = _isNillNumber(min) ? -Infinity : min;
  const MAX = _isNillNumber(max) ? Infinity : max;
  if (_isNillNumber(rawNum)) {
    return MIN;
  }
  return rawNum < MIN ? MIN : rawNum > MAX ? MAX : rawNum;
}
