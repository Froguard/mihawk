'use strict';
import { delNillProps, deepFreeze } from '../../../src/utils/obj';

describe('delNillProps', () => {
  it('应删除对象中的 null 和 undefined 属性', () => {
    const obj: Record<string, any> = { a: 1, b: null, c: undefined, d: 'test', e: 0, f: false };
    delNillProps(obj);
    expect(obj).toEqual({ a: 1, d: 'test', e: 0, f: false });
  });
  it('不应删除 0、false、空字符串', () => {
    const obj: Record<string, any> = { a: 0, b: false, c: '', d: null };
    delNillProps(obj);
    expect(obj).toEqual({ a: 0, b: false, c: '' });
  });
  it('空对象应保持不变', () => {
    const obj: Record<string, any> = {};
    delNillProps(obj);
    expect(obj).toEqual({});
  });
  it('非对象类型应安全处理', () => {
    expect(() => delNillProps(null as any)).not.toThrow();
    expect(() => delNillProps(undefined as any)).not.toThrow();
    expect(() => delNillProps('string' as any)).not.toThrow();
  });
  it('应直接修改原对象', () => {
    const obj: Record<string, any> = { a: 1, b: null };
    const result = delNillProps(obj);
    expect(result).toBeUndefined();
    expect(obj).toEqual({ a: 1 });
  });
});

describe('deepFreeze', () => {
  it('应冻结对象', () => {
    const obj = { a: 1 };
    deepFreeze(obj);
    expect(Object.isFrozen(obj)).toBe(true);
  });
  it('应递归冻结嵌套对象', () => {
    const obj = { a: { b: { c: 1 } } };
    deepFreeze(obj);
    expect(Object.isFrozen(obj)).toBe(true);
    expect(Object.isFrozen(obj.a)).toBe(true);
    expect(Object.isFrozen(obj.a.b)).toBe(true);
  });
  it('应冻结数组', () => {
    const obj = { arr: [1, 2, 3] };
    deepFreeze(obj);
    expect(Object.isFrozen(obj.arr)).toBe(true);
  });
  it('不应冻结正则表达式', () => {
    const obj = { reg: /abc/ };
    deepFreeze(obj);
    expect(Object.isFrozen(obj)).toBe(true);
    expect(Object.isFrozen(obj.reg)).toBe(false);
  });
  it('空值应安全处理', () => {
    expect(() => deepFreeze(null)).not.toThrow();
    expect(() => deepFreeze(undefined)).not.toThrow();
  });
});
