'use strict';
import path from 'path';
import Colors from 'color-cc';
import { readFileSync } from 'fs-extra';
import { Printer, Debugger } from '../utils/print';
import { getRootAbsPath } from '../utils/path';
import type { KoaContext, KoaNext } from '../com-types';

const HTML_FILE_PATH = path.resolve(getRootAbsPath(), './assets/404.html');

/**
 * 中间件生成器
 * @param options
 * @returns
 */
export default function notFound() {
  Debugger.log('mdw-404 init...');
  const html = readFileSync(HTML_FILE_PATH, 'utf-8');

  /**
   * koa 中间件：
   * @param {KoaContext} ctx
   * @param {KoaNext} next
   */
  return async function (ctx: KoaContext, next: KoaNext) {
    const { disableLogPrint, routePath, mockRelPath, request, url } = ctx || {};
    Debugger.log('mdw-404 >>', routePath);

    // ================================================
    //
    await next();
    //
    // ================================================

    // 如果没有匹配到任何路由
    if (ctx.status === 404) {
      const { accept } = request.headers || {};
      // !disableLogPrint && Printer.log('mdw-404', Colors.white.bgYellow.bold(' 404 Not found! '), Colors.yellow(routePath));
      if (accept.includes('text/html') || accept.includes('application/xhtml+xml')) {
        // html
        ctx.set('Content-Type', 'text/html');
        ctx.body = html.replace("'<%= mockRelPath %>'", mockRelPath);
        // ctx.body = `<!DOCTYPE html><html><head><title>404 Not Found</title></head><body><h1>Not Found</h1><p>Target request: ${url}</p></body></html>`;
      } else if (accept.includes('application/json')) {
        // json
        ctx.set('Content-Type', 'application/json');
        ctx.body = JSON.stringify({ code: 404, data: '404 Not Found', msg: `Target request '${url}' was not found!` });
      } else {
        // others
        ctx.set('Content-Type', 'application/json');
        ctx.body = JSON.stringify({ code: 404, data: '404 Not Found', msg: `Target request ${routePath} (${accept}) was not found!` });
      }
    }

    Debugger.log('mdw-404 <<', routePath);
    //
  };
}
