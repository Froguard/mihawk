import { Printer, Debugger } from '../utils/print';
import { PKG_NAME } from '../consts';
import type { KoaContext, KoaNext } from '../com-types';

/**
 * 中间件生成器
 * @param options
 * @returns
 */
export default function (options?: any) {
  /**
   * koa 中间件：
   * @param {KoaContext} ctx
   * @param {KoaNext} next
   */
  return async function (ctx: KoaContext, next: KoaNext) {
    const { method, path } = ctx;
    Debugger.log(`/${method.toUpperCase()} ${path}`);
    ctx.setHeader('X-powered-By', PKG_NAME);
    const startTime = Date.now();
    //
    await next();
    //
    const keepTime = Date.now() - startTime;
    ctx.setHeader('Server-Timing', `mock;dur=${keepTime}ms`);
  };
}
