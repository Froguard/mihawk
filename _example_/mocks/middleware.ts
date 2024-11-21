/**
 * mihawk's middleware file:
 * - just a Koa Middleware
 */
import { KoaContext, KoaNext } from 'mihawk/com-types';

/**
 * Middleware functions, to implement some special data deal logic,
 * - This function exec before the default-mock-logic. Simply return or don`t call "await next()" could skip default-mock-logic
 * - This function is a standard KOA middleware that follows the KOA onion ring model
 * - see more：https://koajs.com/#middleware
 * @param {KoaContext} ctx
 * @param {KoaNext} next
 * @returns {Promise<void>}
 */
export default async function middleware(ctx: KoaContext, next: KoaNext) {
  // do something here
  console.log(ctx.url);
  if (ctx.peth === '/diy') {
    ctx.body = 'it is my diy logic';
  } else {
    await next(); // default logic (such like mock json logic)
  }
}
