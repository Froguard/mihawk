'use strict';
import { dateFormat, getTimeNowStr, ensureDate } from '../../../src/utils/date';

describe('dateFormat', () => {
  const testDate = new Date(2025, 4, 3, 14, 25, 41, 661); // 2025-05-03 14:25:41.661

  it('应支持默认格式', () => {
    expect(dateFormat(testDate)).toBe('2025-05-03 02:25:41');
  });

  it('应支持自定义格式', () => {
    expect(dateFormat(testDate, 'yyyy年MM月dd日')).toBe('2025年05月03日');
    expect(dateFormat(testDate, 'yyyy-M-d')).toBe('2025-5-3');
  });

  it('应支持 24 小时制', () => {
    expect(dateFormat(testDate, 'HH:mm:ss')).toBe('14:25:41');
    expect(dateFormat(testDate, 'H:m:s')).toBe('14:25:41');
  });

  it('应支持 12 小时制', () => {
    expect(dateFormat(testDate, 'hh:mm:ss a')).toBe('02:25:41 PM');
    expect(dateFormat(testDate, 'h:m:s A')).toBe('2:25:41 PM');
  });

  it('应支持毫秒', () => {
    expect(dateFormat(testDate, 'SSS')).toBe('661');
  });

  it('应支持年份简写', () => {
    expect(dateFormat(testDate, 'yy-MM-dd')).toBe('25-05-03');
  });

  it('应正确处理午夜时间', () => {
    const midnight = new Date(2025, 4, 3, 0, 5, 9);
    expect(dateFormat(midnight, 'hh:mm:ss a')).toBe('12:05:09 AM');
    expect(dateFormat(midnight, 'HH:mm:ss')).toBe('00:05:09');
  });

  it('应正确处理中午时间', () => {
    const noon = new Date(2025, 4, 3, 12, 0, 0);
    expect(dateFormat(noon, 'hh:mm:ss a')).toBe('12:00:00 PM');
    expect(dateFormat(noon, 'HH:mm:ss')).toBe('12:00:00');
  });
});

describe('getTimeNowStr', () => {
  it('应返回当前时间字符串', () => {
    const str = getTimeNowStr();
    expect(typeof str).toBe('string');
    expect(str).toMatch(/^\d{4}-\d{2}-\d{2}_\d{2}:\d{2}:\d{2}\.\d{3}$/);
  });
});

describe('ensureDate', () => {
  it('应返回 Date 实例本身', () => {
    const d = new Date();
    expect(ensureDate(d)).toBe(d);
  });

  it('应支持时间戳数字', () => {
    const ts = Date.now();
    const d = ensureDate(ts);
    expect(d instanceof Date).toBe(true);
    expect(d.getTime()).toBe(ts);
  });

  it('应支持标准日期字符串', () => {
    const d = ensureDate('2025-05-03 14:25:41');
    expect(d instanceof Date).toBe(true);
    expect(isNaN(d.getTime())).toBe(false);
  });

  it('应支持斜杠格式日期字符串', () => {
    const d = ensureDate('2025/05/03');
    expect(d instanceof Date).toBe(true);
    expect(isNaN(d.getTime())).toBe(false);
  });

  it('应支持点号格式日期字符串', () => {
    const d = ensureDate('2025.05.03');
    expect(d instanceof Date).toBe(true);
    expect(isNaN(d.getTime())).toBe(false);
  });

  it('noCheck 为 true 时不应输出警告', () => {
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
    ensureDate('invalid date string', true);
    expect(consoleSpy).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
