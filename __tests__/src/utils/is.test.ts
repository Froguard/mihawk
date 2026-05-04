'use strict';
import { getType, isType, isNil, isPrimitvieType, isSimpleJsonPropType, isNumStrict, isNaNStrict, isObjStrict, isEmptyObj, isEmptyArr, isJsonStr } from '../../../src/utils/is';

describe('getType', () => {
  it('应正确判断基本类型', () => {
    expect(getType(null)).toBe('null');
    expect(getType(undefined)).toBe('undefined');
    expect(getType(123)).toBe('number');
    expect(getType(NaN)).toBe('number');
    expect(getType('abc')).toBe('string');
    expect(getType(true)).toBe('boolean');
    expect(getType(false)).toBe('boolean');
    expect(getType({})).toBe('object');
    expect(getType([])).toBe('array');
    expect(getType(new Date())).toBe('date');
    expect(getType(/abc/)).toBe('regexp');
    expect(getType(new Map())).toBe('map');
    expect(getType(new Set())).toBe('set');
    expect(getType(Symbol('test'))).toBe('symbol');
    expect(getType(BigInt(1))).toBe('bigint');
  });
});

describe('isType', () => {
  it('应正确匹配类型', () => {
    expect(isType({}, 'object')).toBe(true);
    expect(isType([], 'array')).toBe(true);
    expect(isType(123, 'number')).toBe(true);
    expect(isType('abc', 'string')).toBe(true);
  });
  it('应支持大小写不敏感匹配', () => {
    expect(isType({}, 'OBJECT')).toBe(true);
    expect(isType([], 'Array')).toBe(true);
  });
});

describe('isNil', () => {
  it('应判定 null 和 undefined 为 true', () => {
    expect(isNil(null)).toBe(true);
    expect(isNil(undefined)).toBe(true);
  });
  it('应判定其他值为 false', () => {
    expect(isNil(0)).toBe(false);
    expect(isNil('')).toBe(false);
    expect(isNil(false)).toBe(false);
    expect(isNil([])).toBe(false);
    expect(isNil({})).toBe(false);
  });
});

describe('isPrimitvieType', () => {
  it('应判定基础类型为 true', () => {
    expect(isPrimitvieType(null)).toBe(true);
    expect(isPrimitvieType(undefined)).toBe(true);
    expect(isPrimitvieType('str')).toBe(true);
    expect(isPrimitvieType(123)).toBe(true);
    expect(isPrimitvieType(true)).toBe(true);
    expect(isPrimitvieType(BigInt(1))).toBe(true);
    expect(isPrimitvieType(Symbol('s'))).toBe(true);
  });
  it('应判定对象和数组为 false', () => {
    expect(isPrimitvieType({})).toBe(false);
    expect(isPrimitvieType([])).toBe(false);
  });
});

describe('isSimpleJsonPropType', () => {
  it('应判定简单 JSON 值为 true', () => {
    expect(isSimpleJsonPropType(null)).toBe(true);
    expect(isSimpleJsonPropType('str')).toBe(true);
    expect(isSimpleJsonPropType(123)).toBe(true);
    expect(isSimpleJsonPropType(true)).toBe(true);
    expect(isSimpleJsonPropType(false)).toBe(true);
  });
  it('应判定复杂类型为 false', () => {
    expect(isSimpleJsonPropType(undefined)).toBe(false);
    expect(isSimpleJsonPropType({})).toBe(false);
    expect(isSimpleJsonPropType([])).toBe(false);
  });
});

describe('isNumStrict', () => {
  it('应判定正常数字为 true', () => {
    expect(isNumStrict(0)).toBe(true);
    expect(isNumStrict(123)).toBe(true);
    expect(isNumStrict(-1.5)).toBe(true);
  });
  it('应判定 NaN 为 false', () => {
    expect(isNumStrict(NaN)).toBe(false);
  });
  it('应判定非数字为 false', () => {
    expect(isNumStrict('123')).toBe(false);
    expect(isNumStrict(null)).toBe(false);
    expect(isNumStrict(undefined)).toBe(false);
  });
});

describe('isNaNStrict', () => {
  it('应只判定 NaN 为 true', () => {
    expect(isNaNStrict(NaN)).toBe(true);
  });
  it('应判定其他值为 false', () => {
    expect(isNaNStrict(0)).toBe(false);
    expect(isNaNStrict('NaN')).toBe(false);
    expect(isNaNStrict(null)).toBe(false);
    expect(isNaNStrict(undefined)).toBe(false);
    expect(isNaNStrict({})).toBe(false);
  });
});

describe('isObjStrict', () => {
  it('应判定纯对象为 true', () => {
    expect(isObjStrict({})).toBe(true);
    expect(isObjStrict({ a: 1 })).toBe(true);
    expect(isObjStrict(Object.create(null))).toBe(true);
  });
  it('应排除数组', () => {
    expect(isObjStrict([])).toBe(false);
    expect(isObjStrict([1, 2])).toBe(false);
  });
  it('应排除 null', () => {
    expect(isObjStrict(null)).toBe(false);
  });
  it('应排除特殊对象实例', () => {
    expect(isObjStrict(new Date())).toBe(false);
    expect(isObjStrict(/abc/)).toBe(false);
    expect(isObjStrict(new Error('test'))).toBe(false);
    expect(isObjStrict(new Map())).toBe(false);
    expect(isObjStrict(new Set())).toBe(false);
    expect(isObjStrict(new WeakMap())).toBe(false);
    expect(isObjStrict(new WeakSet())).toBe(false);
    expect(isObjStrict(new Uint8Array(2))).toBe(false);
    expect(isObjStrict(new Uint16Array(2))).toBe(false);
    expect(isObjStrict(new Uint32Array(2))).toBe(false);
  });
  it('应排除非对象类型', () => {
    expect(isObjStrict('string')).toBe(false);
    expect(isObjStrict(123)).toBe(false);
    expect(isObjStrict(undefined)).toBe(false);
  });
});

describe('isEmptyObj', () => {
  it('应判定空对象为 true', () => {
    expect(isEmptyObj({})).toBe(true);
    expect(isEmptyObj(Object.create(null))).toBe(true);
  });
  it('应判定非空对象为 false', () => {
    expect(isEmptyObj({ a: 1 })).toBe(false);
  });
  it('应判定非对象为 false', () => {
    expect(isEmptyObj([])).toBe(false);
    expect(isEmptyObj(null)).toBe(false);
    expect(isEmptyObj('')).toBe(false);
  });
});

describe('isEmptyArr', () => {
  it('应判定空数组为 true', () => {
    expect(isEmptyArr([])).toBe(true);
  });
  it('应判定非空数组为 false', () => {
    expect(isEmptyArr([1])).toBe(false);
  });
  it('应判定非数组为 false', () => {
    expect(isEmptyArr({})).toBe(false);
    expect(isEmptyArr(null)).toBe(false);
  });
});

describe('isJsonStr', () => {
  it('应判定合法 JSON 字符串为 true', () => {
    expect(isJsonStr('{"a":1}')).toBe(true);
    expect(isJsonStr('[1,2,3]')).toBe(true);
    expect(isJsonStr('"hello"')).toBe(true);
    expect(isJsonStr('123')).toBe(true);
    expect(isJsonStr('true')).toBe(true);
    expect(isJsonStr('null')).toBe(true);
  });
  it('应判定非法 JSON 字符串为 false', () => {
    expect(isJsonStr('{a:1}')).toBe(false);
    expect(isJsonStr('undefined')).toBe(false);
    expect(isJsonStr('')).toBe(false);
    expect(isJsonStr('{"a":}')).toBe(false);
  });
});
