'use strict';
import { resolve } from 'path';
import { createReadStream, readFileSync } from 'fs-extra';
import { getRootAbsPath } from '../utils/path';
import { Debugger } from '../utils/print';
import { PKG_NAME } from '../consts';
import type { KoaContext, KoaNext } from '../com-types';

const PKG_ROOT_PATH = getRootAbsPath();
const CA_ROOT_PATH = resolve(PKG_ROOT_PATH, './assets/.cert/');
const HTML_FILE_PATH = resolve(PKG_ROOT_PATH, './assets/404.html');

/**
 * koa certificate Authority 文件的下载路由，中间件生成器：
 * @returns
 */
export default function certAuthFileDownload() {
  Debugger.log('mdw-certificateAuthority: init...');
  const html = readFileSync(HTML_FILE_PATH, 'utf-8');

  /**
   * koa 中间件函数：
   * @param {KoaContext} ctx
   * @param {KoaNext} next
   */
  return async function (ctx: KoaContext, next: KoaNext) {
    const { path, method } = ctx || {};
    if (path.startsWith('/.cert/')) {
      ctx.skipDefaultMock = true;
      if (['/.cert/ca.crt', '/.cert/localhost.crt'].some(p => p === path)) {
        /**
         * /.cert/ca.crt
         * /.cert/localhost.crt
         */
        if (!['GET', 'HEAD'].includes(method)) {
          ctx.status = 'OPTIONS' == method ? 200 : 405;
          ctx.set('Allow', 'GET, HEAD, OPTIONS');
        } else {
          const fileName = path.replace(/^(\/.cert\/)/, '').trim();
          ctx.set('X-Powered-By', PKG_NAME);
          ctx.set('Cache-Control', `public, max-age=${(86400000 / 1000) | 0}`);
          ctx.set('Content-Disposition', `attachment; filename=${fileName}`);
          ctx.type = 'application/x-x509-ca-cert';
          // 以流的形式返回
          ctx.body = createReadStream(resolve(CA_ROOT_PATH, fileName));
        }
      } else {
        /**
         * 其他
         * /.cert/xx
         * /.cert/xx
         */
        ctx.set('Content-Type', 'text/html');
        ctx.status = 404;
        ctx.body = html.replace(
          '<%= detailMsg %>',
          `The uri(${path}) is not found! Do u mean <a href="/.cert/ca.crt">/.cert/ca.crt</a> or <a href="/.cert/localhost.crt">/.cert/localhost.crt</a> ?`,
        );
        // ctx.throw(404);
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