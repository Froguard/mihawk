'use strict';
import { sleep, timeoutPromise, throttleAsync } from '../../../src/utils/async';

describe('sleep', () => {
  it('应等待指定时间', async () => {
    const start = Date.now();
    await sleep(50);
    const elapsed = Date.now() - start;
    expect(elapsed).toBeGreaterThanOrEqual(40);
    expect(elapsed).toBeLessThan(250);
  });
  it('0ms 应立即返回', async () => {
    const start = Date.now();
    await sleep(0);
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(50);
  });
});

describe('timeoutPromise', () => {
  it('Promise 先完成应返回结果', async () => {
    const result = await timeoutPromise(Promise.resolve('success'), 100);
    expect(result).toBe('success');
  });
  it('超时后应返回 undefined', async () => {
    const slowPromise = new Promise(resolve => setTimeout(() => resolve('late'), 200));
    const result = await timeoutPromise(slowPromise, 50);
    expect(result).toBeUndefined();
  });
  it('Promise 先 reject 应抛出错误', async () => {
    const errPromise = Promise.reject(new Error('test error'));
    await expect(timeoutPromise(errPromise, 100)).rejects.toThrow('test error');
  });
});

describe('throttleAsync', () => {
  it('应限制异步函数执行频率', async () => {
    const fn = jest.fn(async () => 'result');
    const throttled = throttleAsync(fn, 100);

    await throttled();
    await throttled();
    await throttled();

    expect(fn).toHaveBeenCalledTimes(1);
  });
  it('超过间隔时间后应允许再次执行', async () => {
    const fn = jest.fn(async () => 'result');
    const throttled = throttleAsync(fn, 50);

    await throttled();
    await sleep(60);
    await throttled();

    expect(fn).toHaveBeenCalledTimes(2);
  });
  it('应传递参数给原函数', async () => {
    const fn = jest.fn(async (a: number, b: number) => a + b);
    const throttled = throttleAsync(fn, 100);

    await throttled(1, 2);
    expect(fn).toHaveBeenCalledWith(1, 2);
  });
});
