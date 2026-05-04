'use strict';
import Koa from 'koa';
import request from 'supertest';
import mdwError from '../../../src/middlewares/error';

describe('mdwError', () => {
  it('正常执行时不应触发异常处理', async () => {
    const app = new Koa();
    app.use(mdwError());
    app.use(ctx => {
      ctx.body = 'ok';
    });

    const res = await request(app.callback()).get('/').expect(200);
    expect(res.text).toBe('ok');
  });

  it('next() 抛异常时应返回 500 HTML', async () => {
    const app = new Koa();
    app.use(mdwError());
    app.use(ctx => {
      ctx.status = 200; // 显式设置非 404 状态码，确保进入 500 分支
      throw new Error('test error');
    });

    const res = await request(app.callback()).get('/').expect(500);
    expect(res.headers['content-type']).toContain('text/html');
    expect(res.text).toContain('test error');
  });

  it('异常时若 ctx.status 为 404 应返回 404 HTML', async () => {
    const app = new Koa();
    app.use(mdwError());
    app.use(ctx => {
      ctx.status = 404;
      throw new Error('not found');
    });

    const res = await request(app.callback()).get('/missing').expect(404);
    expect(res.headers['content-type']).toContain('text/html');
    expect(res.text).toContain('404');
  });
});
