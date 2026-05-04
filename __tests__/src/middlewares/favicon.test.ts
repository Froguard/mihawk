'use strict';
import Koa from 'koa';
import request from 'supertest';
import mdwFavicon from '../../../src/middlewares/favicon';

describe('mdwFavicon', () => {
  it('GET /favicon.ico 应返回图标内容和正确响应头', async () => {
    const app = new Koa();
    app.use(mdwFavicon('/non-exist.ico'));
    app.use(ctx => {
      ctx.body = 'should-not-reach';
    });

    const res = await request(app.callback()).get('/favicon.ico').expect(200);

    expect(res.headers['x-powered-by']).toBe('mihawk');
    expect(res.headers['cache-control']).toBe('public, max-age=86400');
    expect(res.headers['content-type']).toBe('image/x-icon');
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('GET /favicon.png 应返回图标', async () => {
    const app = new Koa();
    app.use(mdwFavicon('/non-exist.ico'));
    app.use(ctx => {
      ctx.body = 'should-not-reach';
    });

    const res = await request(app.callback()).get('/favicon.png').expect(200);
    expect(res.headers['content-type']).toBe('image/x-icon');
  });

  it('POST /favicon.ico 应返回 405', async () => {
    const app = new Koa();
    app.use(mdwFavicon('/non-exist.ico'));

    const res = await request(app.callback()).post('/favicon.ico').expect(405);
    expect(res.headers['allow']).toBe('GET, HEAD, OPTIONS');
  });

  it('OPTIONS /favicon.ico 应返回 200', async () => {
    const app = new Koa();
    app.use(mdwFavicon('/non-exist.ico'));

    await request(app.callback()).options('/favicon.ico').expect(200);
  });

  it('非 favicon 路径应继续执行后续中间件', async () => {
    const app = new Koa();
    app.use(mdwFavicon('/non-exist.ico'));
    app.use(ctx => {
      ctx.body = 'hello';
    });

    const res = await request(app.callback()).get('/other').expect(200);
    expect(res.text).toBe('hello');
  });
});
