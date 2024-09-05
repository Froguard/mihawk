'use strict';
import { Printer, Debugger } from '../utils/print';
import type { KoaContext, KoaNext, MihawkOptions } from '../com-types';

/**
 * 中间件生成器
 * @param options
 * @returns
 */
export default function (options?: MihawkOptions) {
  Debugger.log('[mdw-mock] init...');

  /**
   * koa 中间件：
   * @param {KoaContext} ctx
   * @param {KoaNext} next
   */
  return async function (ctx: KoaContext, next: KoaNext) {
    Debugger.log('[mdw-mock]', ctx.routePath);
    const { req, res, skipDefaultMock } = ctx;
    if (skipDefaultMock) {
      await next();
    } else {
      Printer.warn('[mdw-mock]', req.url);
    }
  };
}
