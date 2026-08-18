'use strict';
import Koa from 'koa';
import request from 'supertest';
import certAuthFileDownload from '../../../src/middlewares/cert-file';

function bufferParser(res: any, callback: (error: Error | null, body?: Buffer) => void) {
  const chunks: Buffer[] = [];
  res.on('data', (chunk: Buffer) => chunks.push(Buffer.from(chunk)));
  res.on('end', () => callback(null, Buffer.concat(chunks)));
  res.on('error', callback);
}

describe('certAuthFileDownload', () => {
  it('GET /.cert/ca.crt 应下载 CA 证书并设置响应头', async () => {
    const app = new Koa();
    app.use(certAuthFileDownload());

    const res = await request(app.callback()).get('/.cert/ca.crt').buffer(true).parse(bufferParser).expect(200);

    expect(res.headers['x-powered-by']).toBe('mihawk');
    expect(res.headers['cache-control']).toBe('public, max-age=86400');
    expect(res.headers['content-disposition']).toBe('attachment; filename=ca.crt');
    expect(res.headers['content-type']).toContain('application/x-x509-ca-cert');
    expect(res.body.toString()).toContain('BEGIN CERTIFICATE');
  });

  it('非 GET/HEAD 请求应返回方法限制', async () => {
    const app = new Koa();
    app.use(certAuthFileDownload());

    const res = await request(app.callback()).post('/.cert/localhost.crt').expect(405);

    expect(res.headers['allow']).toBe('GET, HEAD, OPTIONS');
  });

  it('不存在的证书路径应返回 404 页面', async () => {
    const app = new Koa();
    app.use(certAuthFileDownload());

    const res = await request(app.callback()).get('/.cert/missing.crt').expect(404);

    expect(res.headers['content-type']).toContain('text/html');
    expect(res.text).toContain('/.cert/ca.crt');
  });

  it('非证书路径应继续执行后续中间件', async () => {
    const app = new Koa();
    app.use(certAuthFileDownload());
    app.use(ctx => {
      ctx.body = 'next';
    });

    await request(app.callback()).get('/health').expect(200, 'next');
  });
});
