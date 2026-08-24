# 自定义中间件

只有将 `mockLogicFileType` 设置为 `js`、`cjs` 或 `ts` 时，Mihawk 才会加载对应后缀的 `mocks/middleware.<ext>`。自定义中间件位于 body parser 和 routes 之后、默认文件 mock 之前，因此可以读取 `ctx.request.body`，并选择：

- 调用 `await next()`，继续执行默认 mock；
- 不调用 `next()` 并直接返回，中止后续中间件；
- 先设置 `ctx.skipDefaultMock = true`，再调用 `next()`，继续执行但明确跳过默认 mock。

## 1. 完全自定义中间件示例

> 使用 Koa 中间件；Mihawk 当前运行于 Koa 3。

下面的路由示例要求 mock 文件所属工程安装 `@koa/router` 和 `koa-compose`。

```ts
import type { Context, Next } from 'koa'; // need koa@v2.0.0+ (eg: koa@^2.15.3)
import Compose from 'koa-compose';
import Router from '@koa/router'; // 弃用 koa-router （v9 开始改用 @koa/router）

/**
 * 初始化 koa-router 实例
 */
const router = new Router();

/**
 * 定义自定义路由
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
 * 导出默认中间件
 * - 使用 koa-compose 组合所有路由中间件
 */
export default Compose([
  router.routes(), //
  router.allowedMethods(),
]);
```

## 2. 使用 Express 中间件

下面的示例要求 mock 文件所属工程安装 `express`。

```ts
import type { NextFunction, Request, Response } from 'express';

/**
 * 标准的 Express 中间件
 */
function expressMiddleware(_req: Request, res: Response, _next: NextFunction) {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('来自 Express 中间件');
}

// 🚀 此处必须显式声明中间件类型，以便 mihawk 能正确识别为 Express 中间件！
expressMiddleware.isExpress = true; // 在 export 导出之前进行设置！

// 导出默认中间件
export default expressMiddleware;
```
