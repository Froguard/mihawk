'use strict';
import { Printer, Debugger } from '../utils/print';
import { isMatchPatterns } from '../utils/str';
import type { KoaContext, KoaNext, MihawkOptions } from '../com-types';

/**
 * 中间件生成器
 * @param options
 * @returns
 */
export default function (routes: Record<string, string>, options?: MihawkOptions) {
  Debugger.log('[mdw-routes] init...', routes);
  const needCheckRoutes = Object.keys(routes)?.length > 0;
  const routeKvEntries = needCheckRoutes ? Object.entries(routes) : [];

  /**
   * koa 中间件：
   * @param {KoaContext} ctx
   * @param {KoaNext} next
   */
  return async function (ctx: KoaContext, next: KoaNext) {
    const { skipDefaultMock, routePath, path } = ctx;
    Debugger.log('[mdw-routes]', routePath);
    if (skipDefaultMock || !needCheckRoutes) {
      await next();
    } else {
      let matched: Record<'route' | 'mockFile', string> | null = null;
      for (const [k, v] of routeKvEntries) {
        if (isMatchPatterns(path, k) || isMatchPatterns(routePath, k)) {
          matched = { route: k, mockFile: v };
          break; // 以第一个匹配到的为准
        }
      }
      if (matched) {
        Printer.warn('[mdw-mock]', matched);
        // TODO: 实现 mock 处理逻辑
        // ...
      } else {
        //
        await next();
        //
      }
    }
  };
}
