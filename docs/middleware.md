# custom your middleware

## 1、compley custom middleware demo

> use koa2-styled middleware

```ts
import type { Context, Next } from 'koa'; // need koa@v2.0.0+ (eg: koa@^2.15.3)
import Compose from 'koa-compose';
import Router from 'koa-router';

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

## 2、use express middleware

```ts
import express from 'express';

/**
 * a normal express middleware
 */
function expressMiddlware(req, res, next) {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('From the Express middleware');
  next();
}

// 🚀 The explicit definition here is necessary, to identify it as an express middleware, so mihawk can resolve in right way!
expressMiddlware.isExpress = true;

// exports a default middleware
export default expressMiddlware;
```
