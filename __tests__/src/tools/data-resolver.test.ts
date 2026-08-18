'use strict';
import { pickRand, getListByPagination, shuffleList, shuffleString } from '../../../src/tools/data-resolver';

describe('data-resolver', () => {
  it('pickRand 应从数组中挑选元素', () => {
    const list = [1, 2, 3];
    expect(list).toContain(pickRand(list));
  });

  it('getListByPagination 应返回分页结果', () => {
    const list = [1, 2, 3, 4, 5];
    expect(getListByPagination(list, { index: 1, size: 2 })).toEqual([1, 2]);
  });

  it('shuffleList 应保留全部元素', () => {
    const list = [1, 2, 3, 4, 5];
    const shuffled = shuffleList(list);
    expect(shuffled).toHaveLength(5);
    expect(shuffled.sort((a, b) => a - b)).toEqual(list);
  });

  it('shuffleString 应返回字符相同的字符串', () => {
    const shuffled = shuffleString('hello');
    expect(shuffled).toHaveLength(5);
    expect(shuffled.split('').sort()).toEqual('hello'.split('').sort());
  });
});
