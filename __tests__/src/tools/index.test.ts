'use strict';

/**
 * 验证 src/tools/index.ts 的导出是否完整且可用
 * - 本文件主要做集成验证，每个函数的具体逻辑已在对应模块的测试文件中覆盖
 */

// data-creator
import {
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
} from '../../../src/tools';

// data-resolver
import { pickRand, dedupe, deepmerge, getListByPagination, shuffleList, shuffleString } from '../../../src/tools';

// type detect
import {
  getType,
  isType,
  isNil,
  isPrimitvieType,
  isSimpleJsonPropType,
  isJsonStr,
  isNumStrict,
  isNaNStrict,
  isObjStrict,
  isEmptyObj,
  isEmptyArr,
  isNullOrUndefined,
  isUndefinedOrNull,
  isEmptyList,
} from '../../../src/tools';

// date
import { dateFormat, ensureDate, getTimeNowStr } from '../../../src/tools';

// obj
import { delNillProps, deepFreeze } from '../../../src/tools';

// str
import { fuzzyIncludes, shallowEqual, isMatchPatterns, formatPatterns, delAddrProtocol } from '../../../src/tools';

// num
import { getSafeNum } from '../../../src/tools';

// async
import { sleep, timeoutPromise } from '../../../src/tools';

// path
import { formatPath, isExistedSync, absifyPath, unixifyPath, relPathToCWD } from '../../../src/tools';

// file
import { readFileSafeSync, readJsonSafeSync, writeFileSafeSync, writeJSONSafeSync } from '../../../src/tools';

// request
import { jsonRequest } from '../../../src/tools';

// parser
import { parseStompMsg } from '../../../src/tools';

// printer
import { Printer } from '../../../src/tools';

// net
import { supportLocalHost, isPortInUse, isLocalHost, getMyIp, detectPort } from '../../../src/tools';

// server
import { getPort, getAddress, getAddrInfo } from '../../../src/tools';

// 3rd-Colors
import { Colors } from '../../../src/tools';

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

  describe('type detect', () => {
    it('getType 应返回类型字符串', () => {
      expect(getType({})).toBe('object');
      expect(getType([])).toBe('array');
    });

    it('isType 应判断类型', () => {
      expect(isType({}, 'object')).toBe(true);
      expect(isType(123, 'number')).toBe(true);
    });

    it('isNil 应判定 null 和 undefined', () => {
      expect(isNil(null)).toBe(true);
      expect(isNil(undefined)).toBe(true);
      expect(isNil(0)).toBe(false);
    });

    it('isPrimitvieType 应判定基础类型', () => {
      expect(isPrimitvieType(123)).toBe(true);
      expect(isPrimitvieType({})).toBe(false);
    });

    it('isSimpleJsonPropType 应判定简单 JSON 值', () => {
      expect(isSimpleJsonPropType('str')).toBe(true);
      expect(isSimpleJsonPropType({})).toBe(false);
    });

    it('isJsonStr 应判定 JSON 字符串', () => {
      expect(isJsonStr('{"a":1}')).toBe(true);
      expect(isJsonStr('not json')).toBe(false);
    });

    it('isNumStrict 应判定有效数字', () => {
      expect(isNumStrict(123)).toBe(true);
      expect(isNumStrict(NaN)).toBe(false);
    });

    it('isNaNStrict 应仅判定 NaN', () => {
      expect(isNaNStrict(NaN)).toBe(true);
      expect(isNaNStrict(0)).toBe(false);
    });

    it('isObjStrict 应判定纯对象', () => {
      expect(isObjStrict({})).toBe(true);
      expect(isObjStrict([])).toBe(false);
    });

    it('isEmptyObj 应判定空对象', () => {
      expect(isEmptyObj({})).toBe(true);
      expect(isEmptyObj({ a: 1 })).toBe(false);
    });

    it('isEmptyArr 应判定空数组', () => {
      expect(isEmptyArr([])).toBe(true);
      expect(isEmptyArr([1])).toBe(false);
    });

    it('别名函数应正常工作', () => {
      expect(isNullOrUndefined(null)).toBe(true);
      expect(isUndefinedOrNull(undefined)).toBe(true);
      expect(isEmptyList([])).toBe(true);
    });
  });

  describe('date', () => {
    it('dateFormat 应格式化日期', () => {
      const d = new Date(2025, 4, 3, 14, 25, 41);
      expect(dateFormat(d, 'yyyy-MM-dd')).toBe('2025-05-03');
    });

    it('getTimeNowStr 应返回当前时间字符串', () => {
      expect(typeof getTimeNowStr()).toBe('string');
    });

    it('ensureDate 应返回 Date 实例', () => {
      expect(ensureDate('2025-05-03') instanceof Date).toBe(true);
      expect(ensureDate(Date.now()) instanceof Date).toBe(true);
    });
  });

  describe('obj', () => {
    it('delNillProps 应删除 null/undefined', () => {
      const obj: Record<string, any> = { a: 1, b: null, c: undefined };
      delNillProps(obj);
      expect(obj).toEqual({ a: 1 });
    });

    it('deepFreeze 应冻结对象', () => {
      const obj = { a: { b: 1 } };
      deepFreeze(obj);
      expect(Object.isFrozen(obj)).toBe(true);
      expect(Object.isFrozen(obj.a)).toBe(true);
    });
  });

  describe('str', () => {
    it('fuzzyIncludes 应支持模糊匹配', () => {
      expect(fuzzyIncludes(['abc', 'def'], 'bc')).toBe(true);
      expect(fuzzyIncludes(['abc', 'def'], 'xyz')).toBe(false);
    });

    it('shallowEqual 应忽略大小写', () => {
      expect(shallowEqual('abc', 'ABC')).toBe(true);
      expect(shallowEqual('abc', 'def')).toBe(false);
    });

    it('isMatchPatterns 应支持 glob', () => {
      expect(isMatchPatterns('a/b/c', 'a/b/*')).toBe(true);
    });

    it('formatPatterns 应过滤空值', () => {
      expect(formatPatterns(['a', null, 'b'])).toEqual(['a', 'b']);
    });

    it('delAddrProtocol 应删除协议头', () => {
      expect(delAddrProtocol('http://example.com')).toBe('example.com');
    });
  });

  describe('num', () => {
    it('getSafeNum 应限制范围', () => {
      expect(getSafeNum(5, { min: 0, max: 10 })).toBe(5);
      expect(getSafeNum(-1, { min: 0, max: 10 })).toBe(0);
      expect(getSafeNum(15, { min: 0, max: 10 })).toBe(10);
    });
  });

  describe('async', () => {
    it('sleep 应等待指定时间', async () => {
      const start = Date.now();
      await sleep(10);
      expect(Date.now() - start).toBeGreaterThanOrEqual(5);
    });

    it('timeoutPromise 应支持超时', async () => {
      const result = await timeoutPromise(new Promise(resolve => setTimeout(() => resolve('ok'), 10)), 5);
      expect(result).toBeUndefined();
    });
  });

  describe('path', () => {
    it('absifyPath 应转为绝对路径', () => {
      expect(absifyPath('/absolute')).toBe('/absolute');
      expect(typeof absifyPath('relative')).toBe('string');
    });

    it('isExistedSync 应判定文件存在性', () => {
      expect(isExistedSync(__filename)).toBe(true);
      expect(isExistedSync('/not/exist')).toBe(false);
    });
  });

  describe('file', () => {
    it('readFileSafeSync 应安全读取', () => {
      expect(typeof readFileSafeSync(__filename)).toBe('string');
      expect(readFileSafeSync('')).toBe('');
    });

    it('readJsonSafeSync 应安全解析', () => {
      expect(readJsonSafeSync('not-exist.json')).toBeNull();
    });
  });

  describe('parser', () => {
    it('parseStompMsg 应解析 STOMP 消息', () => {
      const raw = 'SEND\ndestination:/queue/test\n\nhello\n';
      const msg = parseStompMsg(raw);
      expect(msg.command).toBe('SEND');
      expect(msg.headers.destination).toBe('/queue/test');
      expect(msg.body).toBe('hello');
    });
  });

  describe('printer', () => {
    it('Printer.log 应可调用', () => {
      expect(typeof Printer.log).toBe('function');
    });
    it('Printer.warn 应可调用', () => {
      expect(typeof Printer.warn).toBe('function');
    });
    it('Printer.error 应可调用', () => {
      expect(typeof Printer.error).toBe('function');
    });
  });

  describe('net', () => {
    it('isLocalHost 应判定 localhost', () => {
      expect(isLocalHost('localhost')).toBe(true);
      expect(isLocalHost('example.com')).toBe(false);
    });

    it('supportLocalHost 应支持 localhost 变体', () => {
      expect(supportLocalHost('127.0.0.1')).toBe(true);
    });

    it('getMyIp 应返回字符串', () => {
      expect(typeof getMyIp()).toBe('string');
    });

    it('detectPort 应返回端口检测结果', async () => {
      const result = await detectPort(0);
      expect(typeof result.isInUse).toBe('boolean');
    });
  });

  describe('server', () => {
    it('getPort, getAddress, getAddrInfo 应可调用', () => {
      // 这些函数需要真实 server 实例，仅验证导出可用
      expect(typeof getPort).toBe('function');
      expect(typeof getAddress).toBe('function');
      expect(typeof getAddrInfo).toBe('function');
    });
  });

  describe('3rd Colors', () => {
    it('Colors 应被导出', () => {
      expect(typeof Colors).toBe('object');
      expect(typeof Colors.red).toBe('function');
      expect(typeof Colors.green).toBe('function');
    });
  });
});
