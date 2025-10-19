'use strict';
import { readFileSync, existsSync } from 'fs-extra';
import { absifyPath } from '../utils/path';
import { isNil } from '../utils/is';
// import { Printer } from '../utils/print';
import { PKG_NAME } from '../consts';
import type { KoaContext, KoaNext } from '../com-types';

const ICON_BASE64 = 'data:image/x-icon;base64,8J+YgQ==';
const ICON_MIME = 'image/x-icon';

interface FaviconOptions {
  /**
   * 默认为 image/x-icon
   */
  mime?: string;
  /**
   * 单位 ms
   */
  maxAge?: number;
}

/**
 * koa favicon 中间件生成器：
 * @param {string} faviconPath favicon 文件的绝对路径
 * @param options
 * @returns
 */
export default function favicon(faviconPath: string, options?: FaviconOptions) {
  // Printer.log('mdw-favicon: init...');
  //
  faviconPath = absifyPath(faviconPath);
  const isExisted = existsSync(faviconPath);
  const iconFile = isExisted ? readFileSync(faviconPath) : ICON_BASE64;
  //
  let { maxAge, mime } = options || {};
  maxAge = isNil(maxAge) ? 86400000 : Math.min(Math.max(0, maxAge), 31556926000);
  mime = isExisted ? mime : ICON_MIME;
  const cacheControl = `public, max-age=${(maxAge / 1000) | 0}`;

  /**
   * koa 中间件函数：
   * @param {KoaContext} ctx
   * @param {KoaNext} next
   */
  return async function (ctx: KoaContext, next: KoaNext) {
    const { path, method } = ctx || {};
    /**
     * /favicon.ico
     * /favicon.png
     * /favicon.svg
     */
    if (['/favicon.ico', '/favicon.png', '/favicon.svg'].some(p => p === path)) {
      ctx.skipDefaultMock = true;
      if (!['GET', 'HEAD'].includes(method)) {
        ctx.status = 'OPTIONS' == method ? 200 : 405;
        ctx.set('Allow', 'GET, HEAD, OPTIONS');
      } else {
        ctx.set('X-Powered-By', PKG_NAME);
        ctx.set('Cache-Control', cacheControl);
        ctx.type = mime || ICON_MIME;
        ctx.body = iconFile;
      }
    } else {
      // ================================================
      //
      return next();
      //
      // ================================================
    }
  };
}
