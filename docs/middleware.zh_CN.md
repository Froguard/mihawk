# 自定义中间件

## 1、完全自定义中间件示例

> 使用 koa2 风格中间件

```ts
import type { Context, Next } from 'koa'; // 需要 koa@v2.0.0+ (例如：koa@^2.15.3)
import Compose from 'koa-compose';
import Router from 'koa-router';

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

## 2、使用 Express 中间件

```ts
import express from 'express';

/**
 * 标准的 Express 中间件
 */
function expressMiddlware(req, res, next) {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('来自 Express 中间件');
  next();
}

// 🚀 此处必须显式声明中间件类型，以便 mihawk 能正确识别为 Express 中间件！
expressMiddlware.isExpress = true;

// 导出默认中间件
export default expressMiddlware;
```
