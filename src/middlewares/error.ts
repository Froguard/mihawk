'use strict';
import { resolve } from 'path';
import Colors from 'color-cc';
import { readFileSync } from 'fs-extra';
import { Printer, Debugger } from '../utils/print';
import { getRootAbsPath } from '../utils/path';
import type { KoaContext, KoaNext } from '../com-types';

const ERR_HTML_PATH = resolve(getRootAbsPath(), './assets/50x.html');

/**
 * 中间件生成器
 * @param options
 * @returns
 */
export default function error() {
  Debugger.log('mdw-err: init...');
  const errHtml = readFileSync(ERR_HTML_PATH, 'utf-8');

  /**
   * koa 中间件：
   * @param {KoaContext} ctx
   * @param {KoaNext} next
   */
  return async function (ctx: KoaContext, next: KoaNext) {
    const { disableLogPrint, routePath } = ctx;
    Debugger.log('mdw-err: >>', routePath);
    // !disableLogPrint && Printer.log('mdw-err:', routePath);
    // ================================================
    try {
      //
      await next();
      //
    } catch (err) {
      // ctx.throw(500, err);
      const { message, stack } = (err || {}) as Error;
      const errMsg = message || err?.toString() || 'Something wrong...';
      Printer.error('mdw-err:', Colors.red(`Occurs error: ${errMsg}\n`), err);
      ctx.status = 500;
      ctx.set('Content-Type', 'text/html');
      ctx.body = errHtml.replace('<%= errMsg %>', errMsg).replace('<%= errStack %>', stack || '');
    }
    // ================================================
    Debugger.log('mdw-err: <<', routePath);
  };
}
