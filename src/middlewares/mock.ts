import { Printer, Debugger } from '../utils/print';
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
    const { req, res, skipDefaultMock } = ctx;
    if (skipDefaultMock) {
      await next();
    } else {
      Printer.warn('[koa-middleware]>>>', req.url);
    }
  };
}
