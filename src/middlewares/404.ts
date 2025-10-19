'use strict';
// import Colors from 'color-cc';
import { readFileSync } from 'fs-extra';
// import { Printer } from '../utils/print';
import { ASSET_TPL_HTML_404_PATH } from '../root';
import type { KoaContext, KoaNext } from '../com-types';

/**
 * 中间件生成器
 */
export default function notFound() {
  // Printer.log('mdw-404: init...');
  const html = readFileSync(ASSET_TPL_HTML_404_PATH, 'utf-8');

  /**
   * koa 中间件：
   * @param {KoaContext} ctx
   * @param {KoaNext} next
   */
  return async function (ctx: KoaContext, next: KoaNext) {
    const { /*disableLogPrint,*/ routePath, mockRelPath, request, url } = ctx || {};
    // Printer.log('mdw-404: >>', routePath);

    // ================================================
    //
    await next();
    //
    // ================================================

    // 如果没有匹配到任何路由，且 body 没有被设置
    if (ctx.status === 404 && !ctx.body) {
      const { accept } = request.headers || {};
      // !disableLogPrint && Printer.log('mdw-404:', Colors.white.bgYellow.bold(' 404 Not found! '), Colors.yellow(routePath));
      if (accept.includes('text/html') || accept.includes('application/xhtml+xml')) {
        // html
        ctx.set('Content-Type', 'text/html');
        ctx.body = html.replace('<%= detailMsg %>', `The Mock-data(&nbsp;<i></i>&nbsp;&nbsp;)${mockRelPath} is not found!!!`);
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

    // Printer.log('mdw-404: <<', routePath);
    //
  };
}
