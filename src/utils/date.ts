'use strict';

/**
 * 获取当前时间字符串，格式为 yyyy-mm-dd_hh:mm:ss.ms
 * @returns {string}
 */
export function getTimeNowStr() {
  const now = new Date();
  return [
    [now.getFullYear(), now.getMonth() + 1, now.getDate()].join('-'), // yyyy-mm-dd
    '_', //
    [now.getHours(), now.getMinutes(), now.getSeconds()].join(':'), // hh:mm:ss
    '.', //
    now.getMilliseconds(), // SSS
  ].join('');
}
