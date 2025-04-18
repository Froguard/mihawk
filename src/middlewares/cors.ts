'use strict';
import { Debugger } from '../utils/print';
import type { KoaContext, KoaNext } from '../com-types';

/**
 * 中间件生成器
 * @param options
 * @returns
 */
export default function cors() {
  Debugger.log('mdw-cors: init...');

  /**
   * koa 中间件：
   * @param {KoaContext} ctx
   * @param {KoaNext} next
   */
  return async function (ctx: KoaContext, next: KoaNext) {
    // 允许跨域
    ctx.set('Access-Control-Allow-Origin', '*');
    ctx.set('Access-Control-Allow-Methods', 'POST,GET,PUT,DELETE,HEAD,OPTIONS,TRACE'); // *
    ctx.set('Access-Control-Allow-Headers', 'Content-Type,Content-Length,Content-Range,Authorization,Accept,X-Requested-With,Range,Accept-Ranges'); // *
    // ctx.set('Access-Control-Allow-Credentials', 'true'); // 当设置为 true 时，Access-Control-Allow-Origin 不能为 *
    // ================================================
    //
    await next();
    //
    // ================================================
  };
}
