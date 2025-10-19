'use strict';
import Colors from 'color-cc';
import { readFileSync } from 'fs-extra';
import { Printer } from '../utils/print';
import { ASSET_TPL_HTML_404_PATH, ASSET_TPL_HTML_50X_PATH } from '../root';
import type { KoaContext, KoaNext } from '../com-types';

/**
 * error 中间件生成器
 */
export default function error() {
  // Printer.log('mdw-err: init...');
  const errHtml = readFileSync(ASSET_TPL_HTML_50X_PATH, 'utf-8');
  const notFoundHtml = readFileSync(ASSET_TPL_HTML_404_PATH, 'utf-8');

  /**
   * koa 中间件：为方便能够监控到所有的中间件，建议将本中间件放置在第一个位置进行 app.use(error())
   * @param {KoaContext} ctx
   * @param {KoaNext} next
   */
  return async function (ctx: KoaContext, next: KoaNext) {
    const { /*disableLogPrint, */ path, method } = ctx;
    const logPath = `${method} ${path}`;
    // Printer.log('mdw-err: >>');
    // !disableLogPrint && Printer.log('mdw-err:', logPath);
    // ================================================
    try {
      //
      //
      await next(); // process next middlewares
      //
      //
    } catch (err) {
      // ctx.throw(500, err);
      const { message, stack } = (err || {}) as Error;
      const errMsg = message || err?.toString() || 'Something wrong...';
      Printer.error('MDW-err:', ctx.status, Colors.red(`Occurs error: ${errMsg}\n`), err);
      console.log();
      ctx.set('Content-Type', 'text/html');
      if (ctx.status === 404) {
        // 404
        ctx.body = notFoundHtml.replace('<%= detailMsg %>', `${errMsg}(<em>${logPath}</em> is not found!)`);
      } else {
        // others
        ctx.status = 500;
        // Printer.error('MDW-err stack trace:', stack || 'No stack trace available');
        ctx.body = errHtml.replace('<%= errMsg %>', errMsg).replace('<%= errStack %>', stack);
      }
    }
    // ================================================
    // Printer.log('mdw-err: <<', logPath);
  };
}
