import { readFileSync } from 'fs-extra';
import { absifyPath } from '../utils/path';
import { isNil } from '../utils/is-type';
import type { KoaContext, KoaNext } from '../com-types';

interface FaviconOptions {
  mime?: string;
  maxAge?: number;
}

/**
 * koa favicon 中间件生成器：
 * @param {string} faviconPath favicon 文件的绝对路径
 * @param options
 * @returns
 */
export default function favicon(faviconPath: string, options?: FaviconOptions) {
  //
  let { maxAge, mime } = options || {};
  maxAge = isNil(maxAge) ? 86400000 : Math.min(Math.max(0, maxAge), 31556926000);
  const cacheControl = `public, max-age=${(maxAge / 1000) | 0}`;
  mime = mime || 'image/x-icon';
  const iconFile = readFileSync(absifyPath(faviconPath));
  //
  /**
   * koa 中间件函数：
   * @param {KoaContext} ctx
   * @param {KoaNext} next
   */
  return async function (ctx: KoaContext, next: KoaNext) {
    const { path, method } = ctx || {};
    if (['/favicon.ico', '/favicon.png', '/favicon.svg'].some(p => p === path)) {
      if (!['GET', 'HEAD'].includes(method)) {
        ctx.status = 'OPTIONS' == method ? 200 : 405;
        ctx.set('Allow', 'GET, HEAD, OPTIONS');
      } else {
        ctx.skipDefaultMock = true;
        ctx.set('Cache-Control', cacheControl);
        ctx.type = mime;
        ctx.body = iconFile;
      }
    } else {
      return next();
    }
  };
}
