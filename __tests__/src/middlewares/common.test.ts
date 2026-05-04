'use strict';
import Koa from 'koa';
import request from 'supertest';
import mdwCommon from '../../../src/middlewares/common';

describe('mdwCommon', () => {
  it('应设置 ctx.mockRelPath 和 ctx.routePath', async () => {
    const app = new Koa();
    app.use(mdwCommon());
    app.use(ctx => {
      ctx.body = { mockRelPath: ctx.mockRelPath, routePath: ctx.routePath };
    });

    const res = await request(app.callback()).get('/test/path').expect(200);
    expect(res.body.mockRelPath).toBe('GET/test/path');
    expect(res.body.routePath).toBe('GET /test/path');
  });

  it('应设置 X-Mock-Time、Server-Timing 和 X-Powered-By 响应头', async () => {
    const app = new Koa();
    app.use(mdwCommon());
    app.use(ctx => {
      ctx.body = 'ok';
    });

    const res = await request(app.callback()).get('/').expect(200);
    expect(res.headers['x-mock-time']).toMatch(/^\d+ms$/);
    expect(res.headers['server-timing']).toMatch(/^inner;dur=\d+ms$/);
    expect(res.headers['x-powered-by']).toBe('mihawk');
  });

  it('应支持 POST 请求', async () => {
    const app = new Koa();
    app.use(mdwCommon());
    app.use(ctx => {
      ctx.body = { routePath: ctx.routePath };
    });

    const res = await request(app.callback()).post('/api/user').expect(200);
    expect(res.body.routePath).toBe('POST /api/user');
  });
});
