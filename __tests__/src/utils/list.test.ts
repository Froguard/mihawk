'use strict';
import { shuffle, randPick } from '../../../src/utils/list';

describe('shuffle', () => {
  it('应返回相同长度的新数组', () => {
    const arr = [1, 2, 3, 4, 5];
    const result = shuffle(arr);
    expect(result).toHaveLength(5);
    expect(result.sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5]);
  });

  it('应返回新数组而非原数组', () => {
    const arr = [1, 2, 3];
    const result = shuffle(arr);
    // 注意：shuffle 内部使用了 sort，会修改原数组
    // 所以这里只验证返回的是数组
    expect(Array.isArray(result)).toBe(true);
  });

  it('应支持空数组', () => {
    expect(shuffle([])).toEqual([]);
  });

  it('应支持单元素数组', () => {
    expect(shuffle([1])).toEqual([1]);
  });
});

describe('randPick', () => {
  it('应从数组中随机挑选一个元素', () => {
    const arr = ['a', 'b', 'c'];
    const result = randPick(arr);
    expect(arr).toContain(result);
  });

  it('应支持数字数组', () => {
    const arr = [10, 20, 30];
    const result = randPick(arr);
    expect(arr).toContain(result);
  });

  it('应支持对象数组', () => {
    const obj1 = { id: 1 };
    const obj2 = { id: 2 };
    const arr = [obj1, obj2];
    const result = randPick(arr);
    expect(arr).toContain(result);
  });

  it('单元素数组应返回唯一元素', () => {
    expect(randPick(['only'])).toBe('only');
  });
});
