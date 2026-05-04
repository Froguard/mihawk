'use strict';

/**
 * 验证 src/tools/index.ts 的导出是否完整且可用
 * - 仅覆盖 tools 特有导出（data-creator、data-resolver、别名、detectPort、Colors）
 * - 从 utils 重导出的函数已在 __tests__/src/utils/ 中独立测试，此处不再重复
 */

import {
  // data-creator
  creataRandBool,
  createRandNum,
  createRandChar,
  createRandStr,
  createRandStrByLimit,
  createRandDate,
  createRandDateStr,
  createUUID,
  createRandId,
  createRandUrl,
  createRandPhone,
  createRandEmail,
  createRandColor,
  createRandImage,
  createRandIp,
  createRandName,
  createRandCname,
  createStompMsgStr,
  // data-resolver
  pickRand,
  dedupe,
  deepmerge,
  getListByPagination,
  shuffleList,
  shuffleString,
  // type detect aliases
  isNullOrUndefined,
  isUndefinedOrNull,
  isEmptyList,
  // net
  detectPort,
  // server aliases
  getPort,
  getAddress,
  getAddrInfo,
  // Colors
  Colors,
} from '../../../src/tools';

describe('tools/index 导出验证', () => {
  describe('data-creator', () => {
    it('createRandNum 应返回数字', () => {
      const num = createRandNum(1, 10);
      expect(typeof num).toBe('number');
      expect(num).toBeGreaterThanOrEqual(1);
      expect(num).toBeLessThanOrEqual(10);
    });

    it('createRandStr 应返回字符串', () => {
      const str = createRandStr(5);
      expect(typeof str).toBe('string');
      expect(str.length).toBe(5);
    });

    it('createRandChar 应返回单个字符', () => {
      expect(typeof createRandChar()).toBe('string');
    });

    it('createUUID 应返回有效格式', () => {
      expect(createUUID()).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    });

    it('createRandId 应返回指定长度', () => {
      expect(createRandId(8).length).toBe(8);
    });

    it('createRandColor 应返回 hex 字符串', () => {
      expect(createRandColor()).toMatch(/^[0-9a-f]{6}$/);
    });

    it('createRandDate 应返回 Date 实例', () => {
      expect(createRandDate() instanceof Date).toBe(true);
    });

    it('createRandDateStr 应返回字符串', () => {
      expect(typeof createRandDateStr()).toBe('string');
    });

    it('createRandUrl 应返回 URL 字符串', () => {
      expect(createRandUrl()).toMatch(/^https?:\/\//);
    });

    it('createRandPhone 应返回 11 位数字字符串', () => {
      const phone = createRandPhone();
      expect(phone).toMatch(/^1[3-9]\d{9}$/);
    });

    it('createRandEmail 应包含 @ 和 .com', () => {
      expect(createRandEmail()).toContain('@');
      expect(createRandEmail()).toContain('.com');
    });

    it('createRandIp 应返回 IPv4', () => {
      expect(createRandIp()).toMatch(/^\d{1,3}(\.\d{1,3}){3}$/);
    });

    it('createRandIp(true) 应返回 IPv6', () => {
      expect(createRandIp(true)).toMatch(/^([0-9a-f]{4}:){7}[0-9a-f]{4}$/);
    });

    it('createRandName 应返回字符串', () => {
      expect(typeof createRandName()).toBe('string');
      expect(typeof createRandName('first')).toBe('string');
      expect(typeof createRandName('last')).toBe('string');
    });

    it('createRandCname 应返回中文字符串', () => {
      expect(typeof createRandCname()).toBe('string');
      expect(createRandCname().length).toBeGreaterThanOrEqual(2);
    });

    it('createStompMsgStr 应生成 STOMP 格式消息', () => {
      const msg = createStompMsgStr('SEND', { destination: '/queue/test' }, 'hello');
      expect(msg).toContain('SEND\n');
      expect(msg).toContain('destination:/queue/test');
      expect(msg).toContain('hello');
      expect(msg).toContain('\0');
    });

    it('createRandImage 应返回 picsum 图片地址', () => {
      const url = createRandImage({ width: 200, height: 300 });
      expect(url).toMatch(/^https:\/\/picsum\.photos\/200\/300/);
    });
  });

  describe('data-resolver', () => {
    it('pickRand 应从数组中挑选元素', () => {
      const arr = [1, 2, 3];
      expect(arr).toContain(pickRand(arr));
    });

    it('dedupe 应去重数组', () => {
      expect(dedupe([1, 2, 2, 3])).toEqual([1, 2, 3]);
    });

    it('deepmerge 应深度合并对象', () => {
      expect(deepmerge({ a: { b: 1 } }, { a: { c: 2 } })).toEqual({ a: { b: 1, c: 2 } });
    });

    it('getListByPagination 应返回分页结果', () => {
      const list = [1, 2, 3, 4, 5];
      expect(getListByPagination(list, { index: 1, size: 2 })).toEqual([1, 2]);
    });

    it('shuffleList 应打乱数组', () => {
      const list = [1, 2, 3, 4, 5];
      const shuffled = shuffleList(list);
      expect(shuffled).toHaveLength(5);
      expect(shuffled.sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5]);
    });

    it('shuffleString 应打乱字符串', () => {
      expect(typeof shuffleString('hello')).toBe('string');
      expect(shuffleString('hello').length).toBe(5);
    });
  });

  describe('type detect aliases', () => {
    it('isNullOrUndefined 应判定 null 和 undefined', () => {
      expect(isNullOrUndefined(null)).toBe(true);
      expect(isNullOrUndefined(undefined)).toBe(true);
      expect(isNullOrUndefined(0)).toBe(false);
    });

    it('isUndefinedOrNull 应判定 null 和 undefined', () => {
      expect(isUndefinedOrNull(null)).toBe(true);
      expect(isUndefinedOrNull(undefined)).toBe(true);
      expect(isUndefinedOrNull('')).toBe(false);
    });

    it('isEmptyList 应判定空数组', () => {
      expect(isEmptyList([])).toBe(true);
      expect(isEmptyList([1])).toBe(false);
      expect(isEmptyList({})).toBe(false);
    });
  });

  describe('net', () => {
    it('detectPort 应返回端口检测结果', async () => {
      const result = await detectPort(0);
      expect(typeof result.isInUse).toBe('boolean');
    });
  });

  describe('server aliases', () => {
    it('getPort, getAddress, getAddrInfo 应可调用', () => {
      expect(typeof getPort).toBe('function');
      expect(typeof getAddress).toBe('function');
      expect(typeof getAddrInfo).toBe('function');
    });
  });

  describe('Colors', () => {
    it('Colors 应被导出', () => {
      expect(typeof Colors).toBe('object');
      expect(typeof Colors.red).toBe('function');
      expect(typeof Colors.green).toBe('function');
    });
  });
});
