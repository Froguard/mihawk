'use strict';
import { join } from 'path';
import dedupe from 'free-dedupe';
import { Printer, Debugger } from '../utils/print';
import { isMatchPatterns } from '../utils/str';
import { PKG_NAME, MOCK_DATA_DIR_NAME } from '../consts';
import { unixifyPath } from '../utils/path';
import type { KoaContext, KoaNext, MihawkOptions } from '../com-types';

/**
 * 中间件生成器
 * @param options
 * @returns
 */
export default function (options?: MihawkOptions) {
  Debugger.log('mdw-com init...', options);
  const { logConfig, mockDir } = options || {};
  let { ignoreRoutes } = logConfig || {};
  ignoreRoutes = dedupe(ignoreRoutes || []);
  const needCheckIgnore = ignoreRoutes?.length > 0;

  /**
   * koa 中间件：
   * @param {KoaContext} ctx
   * @param {KoaNext} next
   */
  return async function common(ctx: KoaContext, next: KoaNext) {
    const { method, path } = ctx;
    const routePath = `${method.toUpperCase()} ${path}`;
    Debugger.log('mdw-com >>', routePath);
    const disableLogPrint = needCheckIgnore && isMatchPatterns(routePath, ignoreRoutes);
    !disableLogPrint && Printer.log('mdw-com', routePath);
    // set common props to ctx
    ctx.mockPath = unixifyPath(join(mockDir, MOCK_DATA_DIR_NAME, method, path));
    ctx.routePath = routePath;
    ctx.disableLogPrint = disableLogPrint;
    //
    ctx.set('X-Mock-Powered-By', PKG_NAME);
    const startTime = Date.now();
    // ================================================
    //
    await next();
    //
    // ================================================
    const keepTime = Date.now() - startTime;
    ctx.set('Server-Timing', `do-mock-logic;dur=${keepTime}ms`);
    Debugger.log('mdw-com <<', routePath);
  };
}
