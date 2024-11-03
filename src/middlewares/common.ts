'use strict';
import { join } from 'path';
import dedupe from 'free-dedupe';
import { Printer, Debugger } from '../utils/print';
import { isMatchPatterns } from '../utils/str';
import { PKG_NAME } from '../consts';
import { unixifyPath } from '../utils/path';
import type { KoaContext, KoaNext, MihawkOptions } from '../com-types';

/**
 * 中间件生成器
 * @param options
 * @returns
 */
export default function (options?: MihawkOptions) {
  Debugger.log('mdw-com: init...', options);
  const { logConfig } = options || {};
  let { ignoreRoutes } = logConfig || {};
  ignoreRoutes = dedupe(ignoreRoutes || []).map(ignRt => ignRt.trim().replace(/\s+/g, ' '));
  const needCheckIgnore = ignoreRoutes?.length > 0;

  /**
   * koa 中间件：
   * @param {KoaContext} ctx
   * @param {KoaNext} next
   */
  return async function common(ctx: KoaContext, next: KoaNext) {
    const { method, path } = ctx;
    const routePath = `${method.toUpperCase()} ${path}`;
    const disableLogPrint = needCheckIgnore && (isMatchPatterns(routePath, ignoreRoutes) || isMatchPatterns(path, ignoreRoutes));
    !disableLogPrint && console.log();
    Debugger.log('mdw-com: >>', routePath);
    // set common props to ctx
    /**
     * 是一个相对路径，以 data 文件夹为起始目录
     */
    ctx.mockRelPath = unixifyPath(join(method, path));
    /**
     * 格式为 Method + Path, 如 GET /a/b/c
     */
    ctx.routePath = routePath;
    /**
     * 是否需要禁用打印日志，默认 false, 即：要打印
     */
    ctx.disableLogPrint = disableLogPrint;

    //
    const startTime = Date.now();
    //
    // ================================================
    //
    await next();
    //
    // ================================================
    //
    const keepTime = `${Date.now() - startTime}ms`;
    ctx.set('X-Mock-Time', keepTime);
    ctx.set('Server-Timing', `inner;dur=${keepTime}`);
    ctx.set('X-Powered-By', PKG_NAME);

    //
    Debugger.log(`mdw-com: << ${ctx.type}`, routePath);
  };
}
