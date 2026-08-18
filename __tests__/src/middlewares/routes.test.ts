'use strict';
import Koa from 'koa';
import request from 'supertest';
import mdwRoutes from '../../../src/middlewares/routes';
import { Printer } from '../../../src/utils/print';

function createApp(routes: Record<string, string>, skipDefaultMock = false) {
  const app = new Koa();
  app.use(async (ctx, next) => {
    ctx.mockRelPath = 'GET/users/42';
    ctx.routePath = 'GET /users/42';
    ctx.skipDefaultMock = skipDefaultMock;
    await next();
  });
  app.use(mdwRoutes(routes));
  app.use(ctx => {
    ctx.body = { mockRelPath: ctx.mockRelPath };
  });
  return app;
}

describe('mdwRoutes', () => {
  beforeEach(() => {
    jest.spyOn(Printer, 'log').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('应按请求 path 匹配并重写 mockRelPath', async () => {
    const app = createApp({ '/users/*': './GET/user-detail' });

    const res = await request(app.callback()).get('/users/42').expect(200);

    expect(res.body.mockRelPath).toBe('./GET/user-detail');
  });

  it('应支持按 method + path 匹配路由', async () => {
    const app = createApp({ 'GET /users/*': './GET/user-by-method' });

    const res = await request(app.callback()).get('/users/42').expect(200);

    expect(res.body.mockRelPath).toBe('./GET/user-by-method');
  });

  it('跳过默认 mock 或路由表为空时不应重写', async () => {
    const skipped = await request(createApp({ '/users/*': './GET/other' }, true).callback())
      .get('/users/42')
      .expect(200);
    const empty = await request(createApp({}).callback()).get('/users/42').expect(200);

    expect(skipped.body.mockRelPath).toBe('GET/users/42');
    expect(empty.body.mockRelPath).toBe('GET/users/42');
  });
});
