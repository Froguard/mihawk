# compley custom middleware demo

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
