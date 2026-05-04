'use strict';
import http from 'http';
import { existsSync, unlinkSync } from 'fs-extra';
import mihawk from '../../src';

const TEST_PORT = 19876; // 使用不常用端口避免冲突
const BASE_URL = `http://127.0.0.1:${TEST_PORT}`;

/**
 * 发送 HTTP GET 请求
 */
function httpGet(path: string): Promise<{ status: number; body: any; headers: http.IncomingHttpHeaders }> {
  return new Promise((resolve, reject) => {
    const req = http.get(`${BASE_URL}${path}`, res => {
      let data = '';
      res.on('data', chunk => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode || 0, body: JSON.parse(data), headers: res.headers });
        } catch {
          resolve({ status: res.statusCode || 0, body: data, headers: res.headers });
        }
      });
    });
    req.on('error', reject);
    req.setTimeout(3000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

/**
 * 发送 HTTP POST 请求
 */
function httpPost(path: string, body?: any): Promise<{ status: number; body: any; headers: http.IncomingHttpHeaders }> {
  return new Promise((resolve, reject) => {
    const postData = body ? JSON.stringify(body) : '';
    const options = {
      hostname: '127.0.0.1',
      port: TEST_PORT,
      path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      },
    };
    const req = http.request(options, res => {
      let data = '';
      res.on('data', chunk => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode || 0, body: JSON.parse(data), headers: res.headers });
        } catch {
          resolve({ status: res.statusCode || 0, body: data, headers: res.headers });
        }
      });
    });
    req.on('error', reject);
    req.setTimeout(3000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    if (postData) req.write(postData);
    req.end();
  });
}

describe('mihawk server integration', () => {
  let serverHandle: Awaited<ReturnType<typeof mihawk>> | null = null;

  beforeAll(async () => {
    serverHandle = await mihawk({
      port: TEST_PORT,
      mockDir: './mocks',
      https: false,
      cors: false,
      watch: false,
      cache: false,
    });
    // 等待服务器启动
    await new Promise(resolve => setTimeout(resolve, 500));
  }, 15000);

  afterAll(async () => {
    // 清理集成测试中 auto-init 产生的临时文件
    const autoInitFile = './mocks/data/GET/auto-init-test-404.json';
    if (existsSync(autoInitFile)) {
      unlinkSync(autoInitFile);
    }
    if (serverHandle) {
      await serverHandle.destory();
      serverHandle = null;
    }
  }, 10000);

  it('应返回 GET /test 的 mock JSON 数据', async () => {
    const res = await httpGet('/test');
    expect(res.status).toBe(200);
    expect(res.body.code).toBe(200);
    expect(res.body.data).toEqual({ str: 'test' });
    expect(res.headers['content-type']).toContain('application/json');
  });

  it('应返回 GET /zq 的 mock JSON 数据', async () => {
    const res = await httpGet('/zq');
    expect(res.status).toBe(200);
    expect(res.body.code).toBe(200);
    expect(res.body._meta.method).toBe('GET');
    expect(res.body._meta.route).toBe('GET /zq');
  });

  it('应返回 GET /wf 的 mock JSON 数据', async () => {
    const res = await httpGet('/wf');
    expect(res.status).toBe(200);
    expect(res.body.code).toBe(200);
    expect(res.body.msg).toContain('Auto init file');
  });

  it('应返回 POST /api/user/login 的 mock JSON 数据', async () => {
    const res = await httpPost('/api/user/login');
    expect(res.status).toBe(200);
    expect(res.body.code).toBe(200);
    expect(res.body.data.username).toBe('admin');
  });

  it('不存在的路由应自动初始化并返回 200', async () => {
    const res = await httpGet('/auto-init-test-404');
    expect(res.status).toBe(200);
    expect(res.body.code).toBe(200);
    expect(res.body.msg).toContain('Auto init file');
  });

  it('应设置 X-Mock-Hit 响应头', async () => {
    const res = await httpGet('/test');
    expect(res.status).toBe(200);
    expect(res.headers['x-mock-hit']).toBeDefined();
  });

  it('favicon 请求应被处理', async () => {
    const res = await new Promise<{ status: number; headers: http.IncomingHttpHeaders }>((resolve, reject) => {
      const req = http.get(`${BASE_URL}/favicon.ico`, response => {
        response.resume();
        response.on('end', () => {
          resolve({ status: response.statusCode || 0, headers: response.headers });
        });
      });
      req.on('error', reject);
      req.setTimeout(3000, () => {
        req.destroy();
        reject(new Error('timeout'));
      });
    });
    expect(res.status).toBe(200);
  });
});
