'use strict';
import http from 'http';
import net from 'net';
import os from 'os';
import path from 'path';
import { once } from 'events';
import { createHash, randomBytes } from 'crypto';
import { gzipSync } from 'zlib';
import { mkdtempSync, rmSync, writeFileSync } from 'fs';
import mihawk from '../../src';
import type { KoaContext, MihawkRC } from '../../src/com-types';

type Framing = 'content-length' | 'chunked';

interface HttpResult {
  status: number;
  body: any;
  headers: http.IncomingHttpHeaders;
  socket: net.Socket;
}

const JSON_LIMIT = 1024 * 1024;
const framings: Framing[] = ['content-length', 'chunked'];

it.each([{ bodyParser: null }, { onBodyParserError: null }])('rejects invalid parser config before root null cleanup: %p', async config => {
  await expect(mihawk(config as unknown as MihawkRC)).rejects.toThrow(TypeError);
});

function jsonBody(bytes: number, prefix = '') {
  const padding = bytes - Buffer.byteLength(JSON.stringify({ data: prefix }));
  return Buffer.from(JSON.stringify({ data: prefix + 'x'.repeat(padding) }));
}

describe('mihawk body parser HTTP integration', () => {
  let directory: string;
  let port: number;
  let controller: Awaited<ReturnType<typeof mihawk>> | undefined;
  let state: { downstreamCalls: number };

  beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation(() => undefined);
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    directory = mkdtempSync(path.join(os.tmpdir(), 'mihawk-body-parser-'));
    writeFileSync(
      path.join(directory, 'middleware.cjs'),
      `const { createHash } = require('node:crypto');
const state = { downstreamCalls: 0 };
module.exports = async ctx => {
  ctx.disableLogPrint = true;
  ctx.status = 200;
  if (ctx.path === '/health') {
    ctx.body = { ready: true };
    return;
  }
  state.downstreamCalls += 1;
  if (ctx.path === '/business-error') throw new Error('business failure');
  if (ctx.path === '/raw') {
    const hash = createHash('sha256');
    let bytes = 0;
    for await (const chunk of ctx.req) {
      bytes += chunk.length;
      hash.update(chunk);
    }
    ctx.body = { bytes, sha256: hash.digest('hex') };
    return;
  }
  ctx.body = { parsed: ctx.request.body, rawBody: ctx.request.rawBody };
};
module.exports.state = state;
`,
    );
    state = require(path.join(directory, 'middleware.cjs')).state;
  });

  afterEach(async () => {
    try {
      await controller?.destroy();
    } finally {
      controller = undefined;
      delete require.cache[path.join(directory, 'middleware.cjs')];
      rmSync(directory, { recursive: true, force: true });
      jest.restoreAllMocks();
    }
  });

  async function start(config: MihawkRC = {}) {
    const reservation = net.createServer();
    reservation.listen(0, '127.0.0.1');
    await once(reservation, 'listening');
    port = (reservation.address() as net.AddressInfo).port;
    await new Promise<void>((resolve, reject) => reservation.close(error => (error ? reject(error) : resolve())));
    controller = await mihawk({
      host: '127.0.0.1',
      port,
      mockDir: directory,
      mockLogicFileType: 'cjs',
      https: false,
      cors: false,
      watch: false,
      cache: false,
      socketConfig: false,
      ...config,
    });
    for (let attempt = 0; attempt < 20; attempt += 1) {
      try {
        const health = await request(Buffer.alloc(0), 'content-length', { path: '/health', method: 'GET' });
        expect(health.body).toEqual({ ready: true });
        return;
      } catch (error) {
        if (attempt === 19) throw error;
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    }
  }

  function request(
    payload: Buffer,
    framing: Framing,
    options: { path?: string; method?: string; contentType?: string; contentEncoding?: string; agent?: http.Agent } = {},
  ): Promise<HttpResult> {
    return new Promise((resolve, reject) => {
      const req = http.request(
        {
          hostname: '127.0.0.1',
          port,
          path: options.path || '/echo',
          method: options.method || 'POST',
          agent: options.agent || false,
          headers: {
            Accept: 'application/json',
            'Content-Type': options.contentType || 'application/json',
            ...(options.contentEncoding ? { 'Content-Encoding': options.contentEncoding } : {}),
            ...(framing === 'content-length' ? { 'Content-Length': payload.length } : { 'Transfer-Encoding': 'chunked' }),
          },
        },
        res => {
          const chunks: Buffer[] = [];
          res.on('data', chunk => chunks.push(Buffer.from(chunk)));
          res.on('error', reject);
          res.on('end', () => {
            const text = Buffer.concat(chunks).toString('utf8');
            let body: any;
            try {
              body = JSON.parse(text);
            } catch {
              body = text;
            }
            resolve({ status: res.statusCode || 0, body, headers: res.headers, socket: req.socket });
          });
        },
      );
      req.on('error', reject);
      req.setTimeout(3000, () => req.destroy(new Error('HTTP request timeout')));
      for (let offset = 0; offset < payload.length; offset += 16384) {
        req.write(payload.subarray(offset, offset + 16384));
      }
      req.end();
    });
  }

  it.each(framings)('parses a small JSON request once with %s framing', async framing => {
    await start();
    const payload = Buffer.from('{"data":"正常"}');
    const response = await request(payload, framing);
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ parsed: { data: '正常' }, rawBody: payload.toString() });
    expect(state.downstreamCalls).toBe(1);
  });

  it.each(['GET', 'OPTIONS'])('preserves JSON parsing for %s requests', async method => {
    await start();
    const payload = Buffer.from('{"data":"正常"}');
    const response = await request(payload, 'content-length', { method });
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ parsed: { data: '正常' }, rawBody: payload.toString() });
    expect(state.downstreamCalls).toBe(1);
  });

  it.each(framings)('returns 400 for malformed JSON without running downstream with %s framing', async framing => {
    await start();
    const response = await request(Buffer.from('{"private-data":'), framing);
    expect({ status: response.status, downstreamCalls: state.downstreamCalls }).toEqual({ status: 400, downstreamCalls: 0 });
    expect(response.headers['content-type']).toContain('application/json');
    expect(response.body).toEqual({ code: 400, msg: expect.any(String) });
    expect(JSON.stringify(response.body)).not.toContain('private-data');
  });

  describe.each(['ASCII', 'UTF-8'])('%s byte boundaries', encoding => {
    it.each(framings)('accepts the default JSON limit and rejects one extra byte with %s framing', async framing => {
      const callback = jest.fn();
      await start({ onBodyParserError: callback });
      const prefix = encoding === 'UTF-8' ? '大王' : '';
      const accepted = jsonBody(JSON_LIMIT, prefix);
      const rejected = jsonBody(JSON_LIMIT + 1, prefix);
      expect(accepted.length).toBe(JSON_LIMIT);
      expect(rejected.length).toBe(JSON_LIMIT + 1);
      expect((await request(accepted, framing)).status).toBe(200);
      expect(callback).not.toHaveBeenCalled();
      const response = await request(rejected, framing);
      expect({ status: response.status, downstreamCalls: state.downstreamCalls }).toEqual({ status: 413, downstreamCalls: 1 });
      expect(response.body).toEqual({ code: 413, msg: expect.any(String) });
      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  it.each([128, '256b'])('applies the configured JSON limit %s', async limit => {
    const bytes = typeof limit === 'number' ? limit : 256;
    await start({ bodyParser: { jsonLimit: limit } });
    expect((await request(jsonBody(bytes), 'content-length')).status).toBe(200);
    expect((await request(jsonBody(bytes + 1), 'chunked')).status).toBe(413);
    expect(state.downstreamCalls).toBe(1);
  });

  it('applies a separate form limit', async () => {
    await start({ bodyParser: { jsonLimit: 1024, formLimit: 32 } });
    const form = Buffer.from('data=' + 'x'.repeat(27));
    const accepted = await request(form, 'content-length', { contentType: 'application/x-www-form-urlencoded' });
    expect(accepted.status).toBe(200);
    expect(accepted.body.parsed).toEqual({ data: 'x'.repeat(27) });
    expect((await request(Buffer.concat([form, Buffer.from('x')]), 'chunked', { contentType: 'application/x-www-form-urlencoded' })).status).toBe(413);
    expect(state.downstreamCalls).toBe(1);
  });

  it.each(framings)('leaves a large octet-stream intact with %s framing', async framing => {
    await start({ bodyParser: { jsonLimit: 64, formLimit: 32 } });
    const payload = Buffer.alloc(JSON_LIMIT + 1, 0xa5);
    const response = await request(payload, framing, { path: '/raw', contentType: 'application/octet-stream' });
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ bytes: payload.length, sha256: createHash('sha256').update(payload).digest('hex') });
    expect(state.downstreamCalls).toBe(1);
  });

  it('preserves gzip JSON parsing', async () => {
    await start();
    const payload = Buffer.from('{"data":"正常"}');
    const response = await request(gzipSync(payload), 'content-length', { contentEncoding: 'gzip' });
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ parsed: { data: '正常' }, rawBody: payload.toString() });
    expect(state.downstreamCalls).toBe(1);
  });

  it('returns 413 for gzip JSON that exceeds the decoded byte limit', async () => {
    await start({ bodyParser: { jsonLimit: 128 } });
    const payload = Buffer.from(JSON.stringify({ data: randomBytes(128 * 1024).toString('base64') }));
    const response = await request(gzipSync(payload), 'chunked', { contentEncoding: 'gzip' });
    expect(response.status).toBe(413);
    expect(response.body).toEqual({ code: 413, msg: expect.any(String) });
    expect(state.downstreamCalls).toBe(0);
    expect((await request(Buffer.from('{"data":"ok"}'), 'content-length')).status).toBe(200);
    expect(state.downstreamCalls).toBe(1);
  });

  it('initializes a default response before a synchronous custom callback', async () => {
    const callback = jest.fn((error: unknown, ctx: KoaContext) => {
      expect(error).toBeInstanceOf(Error);
      expect(ctx.status).toBe(400);
      expect(ctx.body).toEqual({ code: 400, msg: expect.any(String) });
      ctx.status = 422;
      ctx.body = { custom: true };
      ctx.set('X-Parser-Error', 'custom');
    });
    await start({ onBodyParserError: callback });
    const response = await request(Buffer.from('{'), 'content-length');
    expect(response.status).toBe(422);
    expect(response.body).toEqual({ custom: true });
    expect(response.headers['x-parser-error']).toBe('custom');
    expect(callback).toHaveBeenCalledTimes(1);
    expect(state.downstreamCalls).toBe(0);
  });

  it('awaits an asynchronous custom callback', async () => {
    const callback = jest.fn(async (_error: unknown, ctx: KoaContext) => {
      await new Promise(resolve => setTimeout(resolve, 20));
      ctx.status = 409;
      ctx.body = { asyncCompleted: true };
      ctx.set('X-Parser-Error', 'async');
    });
    await start({ onBodyParserError: callback });
    const response = await request(Buffer.from('{'), 'chunked');
    expect(response.status).toBe(409);
    expect(response.body).toEqual({ asyncCompleted: true });
    expect(response.headers['x-parser-error']).toBe('async');
    expect(callback).toHaveBeenCalledTimes(1);
    expect(state.downstreamCalls).toBe(0);
  });

  it('preserves the default response when the callback only observes the error', async () => {
    const callback = jest.fn();
    await start({ onBodyParserError: callback });
    const response = await request(Buffer.from('{'), 'chunked');
    expect(response.status).toBe(400);
    expect(response.body).toEqual({ code: 400, msg: expect.any(String) });
    expect(callback).toHaveBeenCalledTimes(1);
    expect(state.downstreamCalls).toBe(0);
  });

  it.each(['throw', 'reject'])('returns 500 without running downstream if the callback fails by %s', async failure => {
    const callback = jest.fn(() => {
      if (failure === 'throw') throw new Error('callback failure');
      return Promise.reject(new Error('callback failure'));
    });
    await start({ onBodyParserError: callback });
    expect((await request(Buffer.from('{'), 'content-length')).status).toBe(500);
    expect(callback).toHaveBeenCalledTimes(1);
    expect(state.downstreamCalls).toBe(0);
    expect((await request(Buffer.from('{"data":"ok"}'), 'content-length')).status).toBe(200);
    expect(state.downstreamCalls).toBe(1);
  });

  it('keeps a business exception outside the parser callback', async () => {
    const callback = jest.fn();
    await start({ onBodyParserError: callback });
    const response = await request(Buffer.from('{"data":"ok"}'), 'content-length', { path: '/business-error' });
    expect(response.status).toBe(500);
    expect(callback).not.toHaveBeenCalled();
    expect(state.downstreamCalls).toBe(1);
  });

  it.each(framings)('handles a normal request after an oversized %s request on a keep-alive client', async framing => {
    const agent = new http.Agent({ keepAlive: true, maxSockets: 1 });
    try {
      await start({ bodyParser: { jsonLimit: 128 } });
      const rejected = await request(jsonBody(JSON_LIMIT + 1), framing, { agent });
      expect(rejected.status).toBe(413);
      expect(rejected.body).toEqual({ code: 413, msg: expect.any(String) });
      expect(state.downstreamCalls).toBe(0);
      const accepted = await request(Buffer.from('{"data":"ok"}'), 'content-length', { agent });
      expect(accepted.status).toBe(200);
      expect(accepted.body.parsed).toEqual({ data: 'ok' });
      if (rejected.headers.connection === 'close') {
        expect(accepted.socket).not.toBe(rejected.socket);
      } else {
        expect(accepted.socket).toBe(rejected.socket);
      }
      expect(state.downstreamCalls).toBe(1);
    } finally {
      agent.destroy();
    }
  });
});
