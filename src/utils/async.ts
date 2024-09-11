'use strict';
/**
 * 异步操作相关封装：
 * - 1.不导出的成员（类型定义除外），请在命名上保持私有命名风格，以下划线_开头，_xxx
 * - 2.尽可能不互相引用 utils/ 文件夹之下的其他兄弟模块，防止形成循环依赖
 */
// import { setTimeout as nodeSetTimeout } from 'node:timers/promises';

/**
 * 异步睡
 * @param {number} time
 * @returns {Promise<void>}
 */
export async function sleep(time: number) {
  // return await nodeSetTimeout(time);
  const aSleep = new Promise(res => setTimeout(res, time)) as Promise<void>;
  return await aSleep;
}

/**
 * promise 超时
 * - 【注意】只能处理一些简单的 Promise，这类 Promise 实例的损耗较小。而一些会占用资源
 *   - 如：文件 io 的一部 Promise 实例，则不建议用这个，而推荐用其自带 timeout 能力。因为即使出发了 timeout 返回，但老的 Promise 依旧会执行
 *   - 又如：一些会对服务器造成一定压力的 fetch，不推荐使用这个包装函数，而更推荐使用 AbortController 的 signal 去做超时中断控制
 * @param {Promise<T>} prms
 * @param {number} time
 * @returns {Promise<T | undefined>} res
 */
export async function timeoutPromise<T = any | undefined>(prms: Promise<T>, time: number) {
  return await Promise.race([
    prms, //
    new Promise(res => setTimeout(res, time)) as Promise<void>,
  ]);
}

/**
 * 常见的异步函数
 */
type AnyAsyncFunc = (...args: any[]) => Promise<any>;

/**
 * 节流 - 异步版本
 * - 立即调用执行，并且确保这次执行完成之后，才允许下一次
 * @param {function} fn
 * @param {number} t
 * 本质：限流的一句话描述是它应尽可能频繁地调用提供的回调，但不应超过 t 毫秒的频率
 */
export function throttleAsync<F extends AnyAsyncFunc>(asyncFn: F, t: number = 0) {
  let lastCall: number | null = null;
  return async function (...args: Parameters<F>) {
    const n = Date.now();
    if (lastCall == null || n - lastCall >= t) {
      lastCall = n;
      await asyncFn(...args); // 与常规的 throttle 不同，这里需要 await
    } else {
      // console.log(`在 ${t} ms 内，函数只执行一次（即第1次）`);
    }
  };
}
