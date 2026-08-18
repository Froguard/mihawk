'use strict';
import Koa from 'koa';
import request from 'supertest';
import mdwMock from '../../../src/middlewares/mock';
import { createDataResolver } from '../../../src/composites/resolve-data';
import type { MihawkOptions } from '../../../src/com-types';

const mockCalcMockData = jest.fn();

jest.mock('../../../src/composites/resolve-data', () => ({
  createDataResolver: jest.fn(() => mockCalcMockData),
}));

describe('mdwMock', () => {
  beforeEach(() => {
    mockCalcMockData.mockReset();
    mockCalcMockData.mockResolvedValue({ code: 200, data: 'mocked' });
    (createDataResolver as jest.Mock).mockClear();
  });

  it('默认分支应返回解析后的 JSON 并标记命中', async () => {
    const app = new Koa();
    const options = { mockDir: './mocks' } as MihawkOptions;
    app.use(async (ctx, next) => {
      ctx.mockRelPath = 'GET/test';
      ctx.routePath = 'GET /test';
      await next();
    });
    app.use(mdwMock(options));

    const res = await request(app.callback()).get('/test').expect(200);

    expect(createDataResolver).toHaveBeenCalledWith(options);
    expect(mockCalcMockData).toHaveBeenCalledTimes(1);
    expect(res.headers['x-mock-hit']).toBe('1');
    expect(res.headers['content-type']).toContain('application/json');
    expect(res.body).toEqual({ code: 200, data: 'mocked' });
  });

  it('skipDefaultMock 时应标记未命中并继续后续中间件', async () => {
    const app = new Koa();
    app.use(async (ctx, next) => {
      ctx.skipDefaultMock = true;
      await next();
    });
    app.use(mdwMock({} as MihawkOptions));
    app.use(ctx => {
      ctx.body = { source: 'custom' };
    });

    const res = await request(app.callback()).get('/custom').expect(200);

    expect(res.headers['x-mock-hit']).toBe('0');
    expect(res.body).toEqual({ source: 'custom' });
    expect(mockCalcMockData).not.toHaveBeenCalled();
  });
});
