'use strict';
import Koa from 'koa';
import request from 'supertest';
import mdwCache from '../../../src/middlewares/cache';

describe('mdwCache', () => {
  it('应设置禁用缓存的响应头', async () => {
    const app = new Koa();
    app.use(mdwCache());
    app.use(ctx => {
      ctx.body = 'ok';
    });

    const res = await request(app.callback()).get('/').expect(200);

    expect(res.headers['pragma']).toBe('No-cache');
    expect(res.headers['cache-control']).toBe('No-cache');
    expect(res.headers['expires']).toBe('0');
    expect(res.headers['vary']).toBe('Origin');
  });

  it('应继续执行后续中间件', async () => {
    const app = new Koa();
    app.use(mdwCache());
    app.use(ctx => {
      ctx.body = { data: 'test' };
    });

    const res = await request(app.callback()).get('/').expect(200);

    expect(res.body).toEqual({ data: 'test' });
  });
});
