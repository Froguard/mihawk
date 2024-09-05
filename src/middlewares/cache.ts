import { Debugger } from '../utils/print';
import type { KoaContext, KoaNext, MihawkOptions } from '../com-types';

/**
 * 中间件生成器
 * @param options
 * @returns
 */
export default function (options?: MihawkOptions) {
  /**
   * koa 中间件：
   * @param {KoaContext} ctx
   * @param {KoaNext} next
   */
  return async function (ctx: KoaContext, next: KoaNext) {
    Debugger.log('[mdw-cache]', ctx.routePath);
    // 禁掉缓存，为了确保每次请求过去的数据都是最新的，方便mock时候debug
    ctx.set('Pragma', 'No-cache');
    ctx.set('Cache-Control', 'No-cache');
    ctx.cookies.set('Expires', '0');
    //
    await next();
  };
}
