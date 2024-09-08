'use strict';

/**
 * 删除对象中的 null 和 undefined 属性
 * @param {object} obj
 * @returns {void} change obj itself, no returns
 */
export function delNillProps<T extends Record<string, any>>(obj: T) {
  if (obj && typeof obj === 'object') {
    Object.entries(obj).forEach(([k, v]) => {
      if (v === null || v === undefined) {
        delete obj[k];
      }
    });
  }
}

/**
 * 深度冻结对象
 * @param {any} obj
 * @return {void}
 */
export function deepFreeze(obj: any) {
  if (obj) {
    // 1.冻结当前对象
    Object.freeze(obj);
    // 2.遍历对象的所有属性
    Object.getOwnPropertyNames(obj).forEach(prop => {
      const value = obj[prop];
      // 如果属性值是对象并且不是 RegExp 对象（正则表达式会被识别为对象，但不需要冻结）
      if (value && typeof value === 'object' && !(value instanceof RegExp)) {
        deepFreeze(value); // 递归调用 deepFreeze
      }
    });
  }
}
