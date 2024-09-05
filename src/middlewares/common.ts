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
    ctx.set('X-powered-By', PKG_NAME);
    const startTime = Date.now();
    //
    await next();
    //
    const keepTime = Date.now() - startTime;
    ctx.set('Server-Timing', `mock;dur=${keepTime}ms`);
  };
}
