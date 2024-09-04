import { Printer, Debugger } from '../utils/print';
import { isMatchPatterns } from '../utils/str';
import { PKG_NAME } from '../consts';
import type { KoaContext, KoaNext } from '../com-types';

/**
 * 中间件生成器
 * @param options
 * @returns
 */
export default function (options?: any) {
  const { logConfig } = options || {};
  const { ignoreRoutes } = logConfig || {};
  const needCheckIgnore = ignoreRoutes?.length > 0;
  /**
   * koa 中间件：
   * @param {KoaContext} ctx
   * @param {KoaNext} next
   */
  return async function (ctx: KoaContext, next: KoaNext) {
    const { method, path } = ctx;
    const routePath = `${method.toUpperCase()}/ ${path}`;
    const disableLogPrint = needCheckIgnore && isMatchPatterns(routePath, ignoreRoutes);
    !disableLogPrint && Printer.log(routePath);
    // set common props to ctx
    ctx.routePath = routePath;
    ctx.disableLogPrint = disableLogPrint;
    //
    ctx.setHeader('X-powered-By', PKG_NAME);
    const startTime = Date.now();
    //
    await next();
    //
    const keepTime = Date.now() - startTime;
    ctx.setHeader('Server-Timing', `mock;dur=${keepTime}ms`);
  };
}
