'use strict';
import Koa from 'koa';
import request from 'supertest';
import mdwNotFound from '../../../src/middlewares/404';

describe('mdwNotFound', () => {
  it('accept 为 json 时应返回 JSON 404 响应', async () => {
    const app = new Koa();
    app.use(mdwNotFound());
    // 不注册任何路由处理中间件

    const res = await request(app.callback()).get('/not-exist').set('Accept', 'application/json').expect(404);

    expect(res.body.code).toBe(404);
    expect(res.body.data).toBe('404 Not Found');
    expect(res.body.msg).toContain('not found');
  });

  it('accept 为 html 时应返回 HTML 404 响应', async () => {
    const app = new Koa();
    app.use(mdwNotFound());

    const res = await request(app.callback()).get('/not-exist').set('Accept', 'text/html').expect(404);

    expect(res.headers['content-type']).toContain('text/html');
    expect(res.text).toContain('404');
  });

  it('已匹配到路由且设置了 body 时不应触发 404', async () => {
    const app = new Koa();
    app.use(mdwNotFound());
    app.use(ctx => {
      ctx.status = 200;
      ctx.body = { ok: true };
    });

    const res = await request(app.callback()).get('/').expect(200);

    expect(res.body).toEqual({ ok: true });
  });
});
