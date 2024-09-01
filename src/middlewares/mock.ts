import { Debugger } from '../utils/debug';
import type { KoaContext, KoaNext } from '../com-types';

/**
 * koa 中间件：
 * @param {KoaContext} ctx
 * @param {KoaNext} next
 */
export default async function (ctx: KoaContext, next: KoaNext) {
  const { req, res } = ctx;
  Debugger.log('[koa-middleware]>>>', req.url);
  await next();
  Debugger.log('[koa-middleware]<<<', req.url);
}
