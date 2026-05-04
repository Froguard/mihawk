'use strict';
import { getSafeNum } from '../../../src/utils/num';

describe('getSafeNum', () => {
  it('应在范围内返回原值', () => {
    expect(getSafeNum(50, { min: 0, max: 100 })).toBe(50);
    expect(getSafeNum(0, { min: 0, max: 100 })).toBe(0);
    expect(getSafeNum(100, { min: 0, max: 100 })).toBe(100);
  });
  it('小于最小值应返回最小值', () => {
    expect(getSafeNum(-10, { min: 0, max: 100 })).toBe(0);
    expect(getSafeNum(-999, { min: -100, max: 100 })).toBe(-100);
  });
  it('大于最大值应返回最大值', () => {
    expect(getSafeNum(150, { min: 0, max: 100 })).toBe(100);
    expect(getSafeNum(999, { min: -100, max: 100 })).toBe(100);
  });
  it('只设置 min 时应以 min 为下限', () => {
    expect(getSafeNum(50, { min: 0 })).toBe(50);
    expect(getSafeNum(-10, { min: 0 })).toBe(0);
  });
  it('只设置 max 时应以 max 为上限', () => {
    expect(getSafeNum(50, { max: 100 })).toBe(50);
    expect(getSafeNum(150, { max: 100 })).toBe(100);
  });
  it('无范围限制时应返回原值', () => {
    expect(getSafeNum(50, {})).toBe(50);
    expect(getSafeNum(-999, {})).toBe(-999);
    expect(getSafeNum(999, {})).toBe(999);
  });
  it('NaN 输入应返回最小值', () => {
    expect(getSafeNum(NaN, { min: 0, max: 100 })).toBe(0);
  });
  it('null 输入应返回最小值', () => {
    expect(getSafeNum(null as any, { min: 10, max: 100 })).toBe(10);
  });
  it('undefined 输入应返回最小值', () => {
    expect(getSafeNum(undefined as any, { min: 10, max: 100 })).toBe(10);
  });
  it('Infinity 边界应正常工作', () => {
    expect(getSafeNum(999, { min: -Infinity, max: Infinity })).toBe(999);
  });
});
