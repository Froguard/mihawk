'use strict';
import Koa from 'koa';
import request from 'supertest';
import mdwCors from '../../../src/middlewares/cors';

describe('mdwCors', () => {
  it('应设置 CORS 响应头', async () => {
    const app = new Koa();
    app.use(mdwCors());
    app.use(ctx => {
      ctx.body = 'ok';
    });

    const res = await request(app.callback()).get('/').expect(200);

    expect(res.headers['access-control-allow-origin']).toBe('*');
    expect(res.headers['access-control-allow-methods']).toContain('GET');
    expect(res.headers['access-control-allow-methods']).toContain('POST');
    expect(res.headers['access-control-allow-headers']).toContain('Content-Type');
  });

  it('OPTIONS 请求应返回 204', async () => {
    const app = new Koa();
    app.use(mdwCors());
    app.use(ctx => {
      ctx.body = 'ok';
    });

    const res = await request(app.callback()).options('/').expect(204);

    expect(res.body).toEqual({});
  });

  it('非 OPTIONS 请求应继续执行后续中间件', async () => {
    const app = new Koa();
    app.use(mdwCors());
    app.use(ctx => {
      ctx.body = { success: true };
    });

    const res = await request(app.callback()).post('/api/test').expect(200);

    expect(res.body).toEqual({ success: true });
  });
});
