'use strict';
import Colors from 'color-cc';

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

/**
 * 宽松型日期数据表示
 */
export type LooseDate = Date | string | number;

/**
 * 确保返回一个 Date 数据，可接受兼容 string 和 Date 格式
 * @param {Date | string | number} dt
 * @returns {Date}
 */
export function ensureDate(dt: LooseDate, noCheck = false) {
  if (dt instanceof Date) {
    return dt;
  } else if (typeof dt === 'number') {
    return new Date(dt);
  } else {
    if (!noCheck) {
      // 如果不在推荐的格式里边，那么提示一下 （注意，以下仅仅是推荐格式，如果不满足这些格式，不代表它不对，只是推荐写成如下）
      const dateRegs: RegExp[] = [
        // 2024-01-01, 2024-1-1, 2024-1-1 12:12, 2024-1-1 12:12:12, 2024-1-1 12:12:12 213, 2024-1-1 12:12:12 213
        /^(\d{4})-(\d{1,2})-(\d{1,2})(?: (\d{1,2})(?::(\d{1,2})){1,2}(?: (\d{3}))?)?$/,
        // 2024.01.01, 2024.1.1, 2024.1.1 12:12, 2024.1.1 12:12:12, 2024.1.1 12:12:12 213, 2024.1.1 12:12:12 213
        /^(\d{4}).(\d{1,2}).(\d{1,2})(?: (\d{1,2})(?::(\d{1,2})){1,2}(?: (\d{3}))?)?$/,
        // 2024/01/01, 2024/1/1, 2024/1/1 12:12, 2024/1/1 12:12:12, 2024/1/1 12:12:12 213, 2024/1/1 12:12:12 213
        /^(\d{4})\/(\d{1,2})\/(\d{1,2})(?: (\d{1,2})(?::(\d{1,2})){1,2}(?: (\d{3}))?)?$/,
      ];
      const isOk = dateRegs.some(reg => dt.match(reg));
      !isOk && console.warn(Colors.red('⚠️ 日期字符串的格式可能有点问题，请检查! 💀'), Colors.magenta(dt));
    }
    return new Date(dt);
  }
}
