'use strict';
import Colors from 'color-cc';
import { Printer, Debugger } from '../utils/print';
import { isMatchPatterns } from '../utils/str';
import type { KoaContext, KoaNext } from '../com-types';

/**
 * 中间件生成器
 * @param options
 * @returns
 */
export default function (routes: Record<string, string>) {
  Debugger.log('mdw-routes init...', routes);
  const needCheckRoutes = Object.keys(routes)?.length > 0;
  const routeKvEntries = needCheckRoutes ? Object.entries(routes) : [];

  /**
   * koa 中间件：
   * @param {KoaContext} ctx
   * @param {KoaNext} next
   */
  return async function (ctx: KoaContext, next: KoaNext) {
    const { disableLogPrint, skipDefaultMock, routePath, path } = ctx;
    Debugger.log('mdw-routes >>', routePath);
    !disableLogPrint && Printer.log('mdw-routes', routePath, Colors.gray(`skipDefaultMock=${!!skipDefaultMock}`));
    //
    if (skipDefaultMock || !needCheckRoutes) {
      //
      await next();
      //
    } else {
      let matched: Record<'route' | 'mockFile', string> | null = null;
      for (const [k, v] of routeKvEntries) {
        if (isMatchPatterns(path, k) || isMatchPatterns(routePath, k)) {
          matched = { route: k, mockFile: v };
          break; // 以第一个匹配到的为准
        }
      }
      if (matched) {
        Printer.log('mdw-routes', `Reset routePath: ${routePath} → ${matched.route}`);
        ctx.routePath = matched.route;
      } else {
        //
        await next();
        //
      }
    }
    //
    Debugger.log('mdw-routes <<', routePath);
  };
}
