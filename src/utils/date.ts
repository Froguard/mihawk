'use strict';
import Colors from 'color-cc';

/**
 * 日期格式化,格式为 yyyy-mm-dd_hh:mm:ss.ms
 * @param {Date} date
 * @returns {string}
 * @example
 *   const now = new Date();
 *   console.log(dateFormat(now)); // 默认格式: yyyy-MM-dd hh:mm:ss, eg: 2025-05-03 04:25:41
 *   console.log(dateFormat(now, 'yyyy年MM月dd日 HH:mm:ss')); // 24小时制, eg: 2025年05月03日 04:25:41
 *   console.log(dateFormat(now, 'yy-M-d h:m:s a')); // 12小时制带AM/PM, eg: 25-5-3 4:25:41 AM
 *   console.log(dateFormat(now, 'yyyy-MM-dd HH:mm:ss.SSS')); // 带毫秒, eg: 2025-05-03 04:25:41.661
 */
export function dateFormat(date: Date, fmt = 'yyyy-MM-dd hh:mm:ss') {
  const leftPadZero = (num: number, len: number = 2) => `${num}`.padStart(len, '0');
  //
  const fullYear = date.getFullYear();
  const hours12 = date.getHours() % 12 || 12;
  const hours24 = date.getHours();
  const ampm = date.getHours() >= 12 ? 'PM' : 'AM';
  //
  const tokens: Record<string, any> = {
    yyyy: fullYear,
    yy: String(fullYear).slice(-2),
    MM: leftPadZero(date.getMonth() + 1, 2),
    M: date.getMonth() + 1,
    dd: leftPadZero(date.getDate(), 2),
    d: date.getDate(),
    HH: leftPadZero(hours24, 2),
    H: hours24,
    hh: leftPadZero(hours12, 2),
    h: hours12,
    mm: leftPadZero(date.getMinutes(), 2),
    m: date.getMinutes(),
    ss: leftPadZero(date.getSeconds(), 2),
    s: date.getSeconds(),
    SSS: leftPadZero(date.getMilliseconds(), 3),
    a: ampm,
    A: ampm.toUpperCase(),
  };
  //
  return fmt.replace(/(yyyy|yy|MM|M|dd|d|HH|H|hh|h|mm|m|ss|s|SSS|a|A)/g, match => {
    return tokens[match] !== undefined ? tokens[match] : match;
  });
}

/**
 * 获取当前时间字符串，格式为 yyyy-mm-dd_hh:mm:ss.ms
 * @returns {string}
 */
export function getTimeNowStr() {
  return dateFormat(new Date(), 'yyyy-MM-dd_hh:mm:ss.SSS');
}

/**
 * 获取一个随机日期
 * @returns {Date}
 */
export function createRandDate() {
  return new Date(+new Date() + Math.floor(Math.random() * 1000000000));
}

/**
 * 获取一个随机日期字符串
 * @param {string} fmt = 'yyyy-MM-dd hh:mm:ss'
 * @returns {string}
 */
export function createRandDateStr(fmt?: string) {
  return dateFormat(createRandDate(), fmt || 'yyyy-MM-dd hh:mm:ss');
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
