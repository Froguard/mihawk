'use strict';
import { STATUS_CODES } from 'http';
import { finished } from 'stream/promises';
import koaBodyParser from 'koa-bodyparser';
import { Printer } from '../utils/print';
import type { KoaBodyParserOptions, KoaMiddleware, MihawkRC } from '../com-types';

/**
 * 将解析阶段与业务阶段分开，确保解析失败时不会继续执行下游 middleware。
 */
export default function bodyParser(config: Pick<MihawkRC, 'bodyParser' | 'onBodyParserError'> = {}): KoaMiddleware {
  const { bodyParser: limits = {}, onBodyParserError } = config;
  if (!limits || typeof limits !== 'object' || Array.isArray(limits)) {
    throw new TypeError('bodyParser must be an object');
  }
  if (onBodyParserError !== undefined && typeof onBodyParserError !== 'function') {
    throw new TypeError('onBodyParserError must be a function');
  }
  const parserOptions: KoaBodyParserOptions = {};
  for (const key of Object.keys(limits)) {
    if (key !== 'jsonLimit' && key !== 'formLimit') {
      throw new TypeError(`Unsupported bodyParser option: ${key}`);
    }
    if (limits[key] !== undefined) parserOptions[key] = parseLimit(limits[key], key);
  }
  // koa-bodyparser 会修改 options，因此只传入独立创建的对象。
  const parse = koaBodyParser(parserOptions);

  return async (ctx, next) => {
    try {
      // 旧解析器总会调用 next，不能将业务阶段的 next 传给它。
      await parse(ctx, async () => undefined);
    } catch (error: unknown) {
      const metadata = typeof error === 'object' && error !== null ? (error as Record<string, unknown>) : {};
      const status =
        [metadata.status, metadata.statusCode].find((value): value is number => typeof value === 'number' && Number.isInteger(value) && value >= 400 && value <= 599) || 500;
      ctx.status = status;
      ctx.type = 'application/json';
      ctx.body = { code: status, msg: STATUS_CODES[status] || 'Request body parsing failed' };
      // 不打印原始错误或消息，其中可能包含请求体。
      Printer.error('mdw-body-parser:', status);
      try {
        await onBodyParserError?.(error, ctx);
      } catch {
        ctx.status = 500;
        ctx.type = 'application/json';
        ctx.body = { code: 500, msg: STATUS_CODES[500] };
        Printer.error('mdw-body-parser: error callback failed');
      }
      // raw-body 在失败时可能暂停请求流；丢弃剩余数据，避免响应结束时中断客户端写入。
      if (!ctx.req.readableEnded) {
        try {
          const drained = finished(ctx.req);
          ctx.req.unpipe();
          ctx.req.resume();
          await drained;
        } catch {
          // 客户端已中断请求，无法再发送完整响应。
          return;
        }
      }
      return;
    }
    await next();
  };
}

/** 校验完整单位格式，避免 bytes.parse 将 "1MiB" 等错误输入当作 1 字节。 */
function parseLimit(value: unknown, key: string): string {
  let bytes = value;
  if (typeof value === 'string') {
    const match = /^(\d+(?:\.\d+)?)\s*(b|kb|mb|gb)?$/i.exec(value.trim());
    const units = { b: 1, kb: 1024, mb: 1024 ** 2, gb: 1024 ** 3 };
    bytes = match ? Number(match[1]) * units[(match[2]?.toLowerCase() || 'b') as keyof typeof units] : NaN;
  }
  if (typeof bytes !== 'number' || !Number.isSafeInteger(bytes) || bytes <= 0) {
    throw new TypeError(`bodyParser.${key} must be a positive safe integer byte count or a size using b/kb/mb/gb`);
  }
  return String(bytes);
}
