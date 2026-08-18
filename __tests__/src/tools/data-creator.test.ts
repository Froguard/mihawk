'use strict';
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
} from '../../../src/tools/data-creator';

describe('data-creator', () => {
  it('createRandNum 应返回指定范围内的数字', () => {
    const num = createRandNum(1, 10);
    expect(typeof num).toBe('number');
    expect(num).toBeGreaterThanOrEqual(1);
    expect(num).toBeLessThanOrEqual(10);
  });

  it('creataRandBool 应返回布尔值', () => {
    expect(typeof creataRandBool()).toBe('boolean');
  });

  it('createRandStrByLimit 应只使用指定字符', () => {
    expect(createRandStrByLimit(5, 'x')).toBe('xxxxx');
  });

  it('createRandStr 应返回指定长度的字符串', () => {
    const str = createRandStr(5);
    expect(typeof str).toBe('string');
    expect(str).toHaveLength(5);
  });

  it('createRandChar 应返回单个字符', () => {
    expect(createRandChar()).toHaveLength(1);
  });

  it('createUUID 应返回有效格式', () => {
    expect(createUUID()).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });

  it('createRandId 应返回指定长度', () => {
    expect(createRandId(8)).toHaveLength(8);
  });

  it('createRandColor 应返回 hex 字符串', () => {
    expect(createRandColor()).toMatch(/^[0-9a-f]{6}$/);
  });

  it('createRandDate 应返回 Date 实例', () => {
    expect(createRandDate()).toBeInstanceOf(Date);
  });

  it('createRandDateStr 应返回字符串', () => {
    expect(typeof createRandDateStr()).toBe('string');
  });

  it('createRandUrl 应返回 URL 字符串', () => {
    expect(createRandUrl()).toMatch(/^https?:\/\//);
  });

  it('createRandPhone 应返回 11 位手机号', () => {
    expect(createRandPhone()).toMatch(/^1[3-9]\d{9}$/);
  });

  it('createRandEmail 应返回邮箱地址', () => {
    expect(createRandEmail()).toMatch(/^[^@]+@[^@]+\.com$/);
  });

  it('createRandIp 应支持 IPv4 和 IPv6', () => {
    expect(createRandIp()).toMatch(/^\d{1,3}(\.\d{1,3}){3}$/);
    expect(createRandIp(true)).toMatch(/^([0-9a-f]{4}:){7}[0-9a-f]{4}$/);
  });

  it('createRandName 应返回英文姓名', () => {
    expect(typeof createRandName()).toBe('string');
    expect(typeof createRandName('first')).toBe('string');
    expect(typeof createRandName('last')).toBe('string');
  });

  it('createRandCname 应返回中文姓名', () => {
    expect(createRandCname()).toMatch(/[\u4e00-\u9fa5]{2,}/);
  });

  it('createStompMsgStr 应生成 STOMP 格式消息', () => {
    const msg = createStompMsgStr('SEND', { destination: '/queue/test' }, 'hello');
    expect(msg).toContain('SEND\n');
    expect(msg).toContain('destination:/queue/test');
    expect(msg).toContain('hello');
    expect(msg).toContain('\0');
  });

  it('createRandImage 应返回 picsum 图片地址', () => {
    expect(createRandImage({ width: 200, height: 300 })).toMatch(/^https:\/\/picsum\.photos\/200\/300/);
  });
});
