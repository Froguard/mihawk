'use strict';

/**
 * 日期格式化,格式为 yyyy-mm-dd_hh:mm:ss.ms
 * @param {Date} date
 * @returns {string}
 */
export function dateFormat(date: Date) {
  return [
    [date.getFullYear(), date.getMonth() + 1, date.getDate()].join('-'), // yyyy-mm-dd
    '_', //
    [date.getHours(), date.getMinutes(), date.getSeconds()].join(':'), // hh:mm:ss
    '.', //
    date.getMilliseconds(), // SSS
  ].join('');
}

/**
 * 获取当前时间字符串，格式为 yyyy-mm-dd_hh:mm:ss.ms
 * @returns {string}
 */
export function getTimeNowStr() {
  return dateFormat(new Date());
}
