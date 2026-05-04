'use strict';
import { fuzzyIncludes, shallowEqual, isMatchPatterns, formatPatterns, delAddrProtocol, getByteSize } from '../../../src/utils/str';

describe('fuzzyIncludes', () => {
  it('应支持全字匹配', () => {
    expect(fuzzyIncludes(['asdadaAAA', 'xczxcBBB'], 'asdadaAAA')).toBe(true);
    expect(fuzzyIncludes(['asdadaAAA', 'xczxcBBB'], 'xczxcBBB')).toBe(true);
  });
  it('应支持子项匹配', () => {
    expect(fuzzyIncludes(['asdadaAAA', 'xczxcBBB'], 'AAA')).toBe(true);
    expect(fuzzyIncludes(['asdadaAAA', 'xczxcBBB'], 'BBB')).toBe(true);
  });
  it('未命中时应返回 false', () => {
    expect(fuzzyIncludes(['asdadaAAA', 'xczxcBBB'], 'CCC')).toBe(false);
  });
  it('空数组应返回 false', () => {
    expect(fuzzyIncludes([], 'test')).toBe(false);
  });
});

describe('shallowEqual', () => {
  it('完全相同的字符串应返回 true', () => {
    expect(shallowEqual('abc', 'abc')).toBe(true);
  });
  it('忽略大小写应返回 true', () => {
    expect(shallowEqual('abc', 'ABC')).toBe(true);
    expect(shallowEqual('AbC', 'aBc')).toBe(true);
  });
  it('忽略首尾空格后相同应返回 true', () => {
    expect(shallowEqual(' abc ', 'abc')).toBe(true);
    expect(shallowEqual('abc', '  abc  ')).toBe(true);
  });
  it('不同字符串应返回 false', () => {
    expect(shallowEqual('abc', 'Bcd')).toBe(false);
    expect(shallowEqual('abc', 'abcd')).toBe(false);
  });
});

describe('formatPatterns', () => {
  it('应过滤空值并转换为字符串', () => {
    expect(formatPatterns(['a', null, 'b', undefined, '', 0, 'c'])).toEqual(['a', 'b', 'c']);
  });
  it('非数组应返回空数组', () => {
    expect(formatPatterns(null as any)).toEqual([]);
    expect(formatPatterns(undefined as any)).toEqual([]);
  });
});

describe('isMatchPatterns', () => {
  it('应支持精确匹配', () => {
    expect(isMatchPatterns('a/b/c/d/e', 'a/b/c/d/e')).toBe(true);
  });
  it('应支持 glob 通配符', () => {
    // anymatch 的 * 匹配单一路径段
    expect(isMatchPatterns('a/b/c/d/e', 'a/b/c/d/*')).toBe(true);
    expect(isMatchPatterns('a/b/c/d/e', 'a/b/*/d/e')).toBe(true);
    // ** 匹配多级路径
    expect(isMatchPatterns('a/b/c/d/e', 'a/b/**')).toBe(true);
    expect(isMatchPatterns('a/b/c/d/e', '**')).toBe(true);
  });
  it('应支持 glob 数组', () => {
    expect(isMatchPatterns('a/b/c/d/e', ['a/b/c/d/e', 'x/y/z'])).toBe(true);
    expect(isMatchPatterns('a/b/c/d/e', ['x/y/z', 'a/b/c/d/*'])).toBe(true);
  });
  it('未匹配时应返回 false', () => {
    expect(isMatchPatterns('a/b/c/d/e', 'x/y/z')).toBe(false);
    expect(isMatchPatterns('a/b/c/d/e', 'a/b/c/*')).toBe(false); // * 只匹配单一路径段
  });
  it('空模式应返回 false', () => {
    expect(isMatchPatterns('a/b/c/d/e', [])).toBe(false);
  });
});

describe('delAddrProtocol', () => {
  it('应删除 http:// 协议头', () => {
    expect(delAddrProtocol('http://example.com')).toBe('example.com');
  });
  it('应删除 https:// 协议头', () => {
    expect(delAddrProtocol('https://example.com')).toBe('example.com');
  });
  it('应删除 file:// 协议头', () => {
    expect(delAddrProtocol('file:///path/to/file')).toBe('/path/to/file');
  });
  it('应删除末尾的斜杠', () => {
    expect(delAddrProtocol('http://example.com/')).toBe('example.com');
    expect(delAddrProtocol('http://example.com///')).toBe('example.com');
  });
  it('无协议头时应原样返回', () => {
    expect(delAddrProtocol('example.com')).toBe('example.com');
  });
  it('空字符串应返回空', () => {
    expect(delAddrProtocol('')).toBe('');
  });
});

describe('getByteSize', () => {
  it('应正确计算 ASCII 字符串字节数', () => {
    expect(getByteSize('hello')).toBe(5);
    expect(getByteSize('')).toBe(0);
  });
  it('应正确计算中文字符字节数', () => {
    expect(getByteSize('你好')).toBe(6);
  });
  it('空值应返回 0', () => {
    expect(getByteSize('' as any)).toBe(0);
    expect(getByteSize(null as any)).toBe(0);
    expect(getByteSize(undefined as any)).toBe(0);
  });
});
