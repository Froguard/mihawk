# Custom middleware

Mihawk loads `mocks/middleware.<ext>` only when `mockLogicFileType` is `js`, `cjs`, or `ts`; the extension must match that setting. The middleware runs after body parsing and route mapping, and before the default file-based mock. It can therefore read `ctx.request.body` and either:

- call `await next()` to continue to the default mock;
- return without calling `next()` to stop the chain; or
- set `ctx.skipDefaultMock = true` before calling `next()` to continue while explicitly skipping the default mock.

## 1. Complete custom middleware example

> Uses Koa middleware. Mihawk currently runs on Koa 3.

The router example requires `@koa/router` and `koa-compose` in the project that owns the mock files.

```ts
import type { Context, Next } from 'koa'; // require koa@v2.0.0+ (eg: koa@^2.15.3)
import Compose from 'koa-compose';
import Router from '@koa/router'; // koa-router deprecated (use @koa/router since v9)

/**
 * init a koa-router instance
 */
const router = new Router();

/**
 * define your each custom routes
 */
// GET /a/b/c
router.get('/a/b/c', async (ctx: Context, next: Next) => {
  // ...
});
// POST /w/x/y
router.post('/w/x/y', async (ctx: Context, next: Next) => {
  // ...
});
// ...

/**
 * exports a default middleware
 * - use koa-compose to compose all routes middleware
 */
export default Compose([
  router.routes(), //
  router.allowedMethods(),
]);
```

## 2. Express middleware

This example requires `express` in the project that owns the mock files.

```ts
import type { NextFunction, Request, Response } from 'express';

/**
 * a normal express middleware
 */
function expressMiddleware(_req: Request, res: Response, _next: NextFunction) {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('From the Express middleware');
}

// 🚀 The explicit definition here is necessary, to identify it as an express middleware, so mihawk can resolve in right way!
expressMiddleware.isExpress = true; // set before export

// exports a default middleware
export default expressMiddleware;
```
