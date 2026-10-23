'use strict';
import koaBodyParser from 'koa-bodyparser';
import bodyParser from '../../../src/middlewares/body-parser';
import { Printer } from '../../../src/utils/print';
import type { KoaContext, MihawkRC } from '../../../src/com-types';

jest.mock('koa-bodyparser', () => ({ __esModule: true, default: jest.fn() }));

function createContext() {
  return {
    req: { readableEnded: true, resume: jest.fn() },
    res: { shouldKeepAlive: true },
    set: jest.fn(),
  } as unknown as KoaContext;
}

describe('bodyParser', () => {
  const parse = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (koaBodyParser as jest.Mock).mockImplementation(() => parse);
    parse.mockImplementation(async (_ctx, next) => next());
    jest.spyOn(Printer, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('解析成功后应执行下游，传给解析器的 next 应独立于业务 next', async () => {
    const ctx = createContext();
    const next = jest.fn().mockResolvedValue(undefined);

    await bodyParser()(ctx, next);

    expect(parse).toHaveBeenCalledWith(ctx, expect.any(Function));
    expect(parse.mock.calls[0][1]).not.toBe(next);
    expect(next).toHaveBeenCalledTimes(1);
    expect(Printer.error).not.toHaveBeenCalled();
  });

  it.each([
    ['已有 request.body', { request: { body: { alreadyParsed: true } } }],
    ['disableBodyParser=true', { request: {}, disableBodyParser: true }],
  ])('%s 时真实解析器应跳过请求流并仅执行一次下游', async (_name, preset) => {
    (koaBodyParser as jest.Mock).mockImplementation(jest.requireActual('koa-bodyparser'));
    const ctx = Object.assign(createContext(), preset);
    const readRequest = jest.fn(() => {
      throw new Error('Request stream must not be read');
    });
    Object.defineProperty(ctx, 'req', { get: readRequest });
    const next = jest.fn().mockResolvedValue(undefined);

    await bodyParser()(ctx, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(readRequest).not.toHaveBeenCalled();
    expect(Printer.error).not.toHaveBeenCalled();
  });

  it.each([
    [{ status: 400 }, 400, 'Bad Request'],
    [{ status: 413 }, 413, 'Payload Too Large'],
    [{ status: 422 }, 422, 'Unprocessable Entity'],
    [{ status: 499 }, 499, 'Request body parsing failed'],
    [{ status: 599 }, 599, 'Request body parsing failed'],
    [{ statusCode: 415 }, 415, 'Unsupported Media Type'],
    [{ status: 400, statusCode: 413 }, 400, 'Bad Request'],
    [{ status: 200, statusCode: 413 }, 413, 'Payload Too Large'],
    [{ status: '400', statusCode: 422 }, 422, 'Unprocessable Entity'],
    [{ status: 400.5, statusCode: 415 }, 415, 'Unsupported Media Type'],
    [{ status: 399 }, 500, 'Internal Server Error'],
    [{ status: 600 }, 500, 'Internal Server Error'],
    [{ status: 400.5 }, 500, 'Internal Server Error'],
    [{ status: '400' }, 500, 'Internal Server Error'],
    [{ status: NaN }, 500, 'Internal Server Error'],
    [{ statusCode: Infinity }, 500, 'Internal Server Error'],
    [new Error('private request body'), 500, 'Internal Server Error'],
    ['private request body', 500, 'Internal Server Error'],
    [null, 500, 'Internal Server Error'],
  ])('解析异常 %p 应保留合法错误状态或回退 500', async (error, status, msg) => {
    parse.mockImplementation(async (_ctx, parserNext) => {
      await parserNext();
      throw error;
    });
    const ctx = createContext();
    const next = jest.fn();

    await bodyParser()(ctx, next);

    expect(ctx.status).toBe(status);
    expect(ctx.type).toBe('application/json');
    expect(ctx.body).toEqual({ code: status, msg });
    expect(next).not.toHaveBeenCalled();
    expect(Printer.error).toHaveBeenCalledWith('mdw-body-parser:', status);
  });

  it.each([
    ['未配置', undefined],
    ['同步空回调', jest.fn(() => undefined)],
    ['异步空回调', jest.fn(async () => undefined)],
  ])('%s 应保留默认响应并将原始异常传入回调', async (_name, onBodyParserError) => {
    const error = Object.assign(new Error('private body'), { status: 422 });
    parse.mockRejectedValue(error);
    const ctx = createContext();
    const next = jest.fn();

    await bodyParser({ onBodyParserError })(ctx, next);

    expect(ctx.status).toBe(422);
    expect(ctx.body).toEqual({ code: 422, msg: 'Unprocessable Entity' });
    expect(ctx.type).toBe('application/json');
    expect(next).not.toHaveBeenCalled();
    if (onBodyParserError) expect(onBodyParserError).toHaveBeenCalledWith(error, ctx);
  });

  it.each([
    ['同步', false],
    ['异步', true],
  ])('应等待自定义%s错误回调并保留其响应', async (_name, asynchronous) => {
    const error = { status: 413 };
    parse.mockRejectedValue(error);
    const ctx = createContext();
    const customize = (received: unknown, receivedCtx: KoaContext) => {
      expect(received).toBe(error);
      expect(receivedCtx).toBe(ctx);
      expect(ctx.status).toBe(413);
      expect(ctx.body).toEqual({ code: 413, msg: 'Payload Too Large' });
      ctx.status = 422;
      ctx.type = 'text/plain';
      ctx.body = 'request rejected';
    };
    const onBodyParserError = asynchronous
      ? async (received: unknown, receivedCtx: KoaContext) => {
          await Promise.resolve();
          customize(received, receivedCtx);
        }
      : customize;

    await bodyParser({ onBodyParserError })(ctx, jest.fn());

    expect(ctx.status).toBe(422);
    expect(ctx.type).toBe('text/plain');
    expect(ctx.body).toBe('request rejected');
  });

  it.each([
    ['同步', false],
    ['异步', true],
  ])('%s错误回调抛异常时应返回通用 JSON 500，日志不包含请求体或异常对象', async (_name, asynchronous) => {
    const original = Object.assign(new Error('secret original body'), { status: 400, body: 'secret original body' });
    const callbackError = new Error('secret callback body');
    parse.mockRejectedValue(original);
    const fail = () => {
      throw callbackError;
    };
    const onBodyParserError = asynchronous ? async () => fail() : fail;
    const ctx = createContext();
    const next = jest.fn();

    await bodyParser({ onBodyParserError })(ctx, next);

    expect(ctx.status).toBe(500);
    expect(ctx.type).toBe('application/json');
    expect(ctx.body).toEqual({ code: 500, msg: 'Internal Server Error' });
    expect(next).not.toHaveBeenCalled();
    expect(Printer.error).toHaveBeenNthCalledWith(1, 'mdw-body-parser:', 400);
    expect(Printer.error).toHaveBeenNthCalledWith(2, 'mdw-body-parser: error callback failed');
    expect(JSON.stringify((Printer.error as jest.Mock).mock.calls)).not.toContain('secret');
    expect((Printer.error as jest.Mock).mock.calls.flat()).not.toContain(original);
    expect((Printer.error as jest.Mock).mock.calls.flat()).not.toContain(callbackError);
  });

  it('下游异常应继续抛出，不应触发解析错误回调或日志', async () => {
    const error = Object.assign(new Error('business failed'), { status: 422 });
    const onBodyParserError = jest.fn();

    await expect(
      bodyParser({ onBodyParserError })(createContext(), async () => {
        throw error;
      }),
    ).rejects.toBe(error);

    expect(onBodyParserError).not.toHaveBeenCalled();
    expect(Printer.error).not.toHaveBeenCalled();
  });

  it('解析器应接收独立 options，上游对 options 的修改不得污染输入或其他实例', () => {
    const limits = Object.freeze({ jsonLimit: '2kb', formLimit: 4096 });
    const received: Record<string, unknown>[] = [];
    const snapshots: Record<string, unknown>[] = [];
    (koaBodyParser as jest.Mock).mockImplementation(options => {
      received.push(options);
      snapshots.push({ ...options });
      options.jsonLimit = 'changed by koa-bodyparser';
      options.enableTypes = ['json'];
      return parse;
    });

    bodyParser({ bodyParser: limits });
    bodyParser({ bodyParser: limits });

    expect(limits).toEqual({ jsonLimit: '2kb', formLimit: 4096 });
    expect(received[0]).not.toBe(limits);
    expect(received[1]).not.toBe(received[0]);
    expect(snapshots).toEqual([
      { jsonLimit: '2048', formLimit: '4096' },
      { jsonLimit: '2048', formLimit: '4096' },
    ]);
  });

  it('未配置上限或显式 undefined 时应交由解析器采用自身默认值', () => {
    bodyParser();
    bodyParser({ bodyParser: { jsonLimit: undefined, formLimit: undefined } });

    expect(koaBodyParser).toHaveBeenNthCalledWith(1, {});
    expect(koaBodyParser).toHaveBeenNthCalledWith(2, {});
  });

  describe.each(['jsonLimit', 'formLimit'] as const)('%s', key => {
    it.each([
      [1, '1'],
      [1024, '1024'],
      [Number.MAX_SAFE_INTEGER, String(Number.MAX_SAFE_INTEGER)],
      ['12', '12'],
      [' 12 b ', '12'],
      ['1.0B', '1'],
      ['1.5kb', '1536'],
      ['0.5 KB', '512'],
      ['0.5mb', '524288'],
      [' 1.5 MB ', '1572864'],
      ['1.25gb', '1342177280'],
      ['0.0009765625kb', '1'],
    ])('合法上限 %p 应完整换算为 %s 字节', (value, bytes) => {
      bodyParser({ bodyParser: { [key]: value } });

      expect(koaBodyParser).toHaveBeenCalledWith({ [key]: bytes });
    });

    it.each([
      0,
      -1,
      1.5,
      Infinity,
      NaN,
      Number.MAX_SAFE_INTEGER + 1,
      '',
      '0',
      '0b',
      '0kb',
      '-1',
      '-1kb',
      'Infinity',
      'NaN',
      '1MiB',
      '1tb',
      '1kb trailing',
      '1xkb',
      '1.2.3kb',
      '1e3',
      '1e3kb',
      '1.5b',
      '1.1kb',
      '9007199254740992',
      '9007199254740992b',
      null,
      true,
      {},
      [],
    ])('非法上限 %p 应在创建解析器前被拒绝', value => {
      const config = { bodyParser: { [key]: value } } as unknown as MihawkRC;

      expect(() => bodyParser(config)).toThrow(`bodyParser.${key} must be a positive safe integer byte count`);
      expect(koaBodyParser).not.toHaveBeenCalled();
    });
  });

  it.each(['onerror', 'enableTypes', 'textLimit'])('未开放的选项 %s 应被拒绝', key => {
    expect(() => bodyParser({ bodyParser: { [key]: jest.fn() } } as unknown as MihawkRC)).toThrow(`Unsupported bodyParser option: ${key}`);
    expect(koaBodyParser).not.toHaveBeenCalled();
  });

  it.each([null, [], '1mb', 1024, false])('非法 bodyParser 配置 %p 应被拒绝', value => {
    expect(() => bodyParser({ bodyParser: value } as unknown as MihawkRC)).toThrow('bodyParser must be an object');
    expect(koaBodyParser).not.toHaveBeenCalled();
  });

  it.each([null, true, 'callback', {}])('非法错误回调 %p 应被拒绝', value => {
    expect(() => bodyParser({ onBodyParserError: value } as unknown as MihawkRC)).toThrow('onBodyParserError must be a function');
    expect(koaBodyParser).not.toHaveBeenCalled();
  });
});
