'use strict';
import dedupe from 'free-dedupe';
import { Printer, Debugger } from '../utils/print';
import { isMatchPatterns } from '../utils/str';
import { PKG_NAME } from '../consts';
import type { KoaContext, KoaNext, MihawkOptions } from '../com-types';

/**
 * 中间件生成器
 * @param options
 * @returns
 */
export default function (options?: MihawkOptions) {
  Debugger.log('[mdw-common] init...', options);
  const { logConfig } = options || {};
  let { ignoreRoutes } = logConfig || {};
  ignoreRoutes = dedupe(ignoreRoutes);
  const needCheckIgnore = ignoreRoutes?.length > 0;

  /**
   * koa 中间件：
   * @param {KoaContext} ctx
   * @param {KoaNext} next
   */
  return async function (ctx: KoaContext, next: KoaNext) {
    const { method, path } = ctx;
    const routePath = `${method.toUpperCase()} ${path}`;
    Debugger.log('[mdw-common]', routePath);
    const disableLogPrint = needCheckIgnore && isMatchPatterns(routePath, ignoreRoutes);
    !disableLogPrint && Printer.log(routePath);
    // set common props to ctx
    ctx.routePath = routePath;
    ctx.disableLogPrint = disableLogPrint;
    //
    ctx.set('X-Mock-Powered-By', PKG_NAME);
    const startTime = Date.now();

    // ================================================
    try {
      //
      await next();
      //
    } catch (err) {
      // ctx.throw(500, err);
      const errMsg = (err as any)?.message || err?.toString() || 'unknown error';
      Printer.error('[mdw-common]', `Occurs error: ${errMsg}`, err);
      ctx.status = 500;
      ctx.set('Content-Type', 'application/json');
      ctx.body = JSON.stringify({ code: 500, data: '500 Server inner error', msg: `${errMsg}` });
    }
    // ================================================

    const keepTime = Date.now() - startTime;
    ctx.set('Server-Timing', `mock;dur=${keepTime}ms`);
  };
}
