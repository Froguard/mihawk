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
