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

/**
 * 创建随机数
 * - 随机数满足范围限定
 * - 随机数是一个整数，而非小数
 * @param {number} min 生成的数限定范围，最小值
 * @param {number} max 生成的数限定范围，最大值
 * @returns {number} 生成的随机数
 */
export function createRandNum(min: number = 0, max: number = 9999) {
  // 参数合法性校验
  if (typeof min !== 'number' || isNaN(min) || typeof max !== 'number' || isNaN(max)) {
    throw new Error('Arguments must be valid numbers');
  }

  // 处理 min > max 的边界情况（自动交换）
  const [lowerBound, upperBound] = min <= max ? [min, max] : [max, min];

  // 计算有效整数范围
  const minInt = Math.ceil(lowerBound);
  const maxInt = Math.floor(upperBound);

  // 检查是否存在有效整数区间
  if (minInt > maxInt) {
    throw new Error('No valid integer exists between min and max');
  }

  // 生成区间内随机整数（闭区间 [minInt, maxInt]）
  return Math.floor(Math.random() * (maxInt - minInt + 1)) + minInt;
}
