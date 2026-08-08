'use strict';
import { buildRemoteRequestUrl, jsonRequest } from '../../../src/utils/request';

describe('jsonRequest', () => {
  let fetchMock: jest.Mock;

  beforeEach(() => {
    fetchMock = jest.fn();
    global.fetch = fetchMock;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('应发送 GET 请求并返回 JSON', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      headers: { get: (name: string) => (name.toLowerCase() === 'content-type' ? 'application/json' : null) },
      json: async () => ({ success: true }),
    });
    const result = await jsonRequest('https://example.com/api');
    expect(result).toEqual({ success: true });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const callArgs = fetchMock.mock.calls[0];
    expect(callArgs[0]).toBe('https://example.com/api');
  });

  it('应强制设置 Content-Type 为 application/json', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      headers: { get: () => 'application/json' },
      json: async () => ({}),
    });
    await jsonRequest('https://example.com/api', { method: 'POST', body: '{}' });
    const callArgs = fetchMock.mock.calls[0];
    expect(callArgs[1].headers['Content-Type']).toBe('application/json');
  });

  it('应删除 GET 请求的 body', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      headers: { get: () => 'application/json' },
      json: async () => ({}),
    });
    await jsonRequest('https://example.com/api', { method: 'GET', body: 'should-be-removed' });
    const callArgs = fetchMock.mock.calls[0];
    expect(callArgs[1].body).toBeUndefined();
  });

  it('请求超时后应中断请求并抛出 TimeoutError', async () => {
    fetchMock.mockImplementation((_url, init) => {
      return new Promise((_resolve, reject) => {
        init.signal.addEventListener('abort', () => reject(new Error('aborted')));
      });
    });

    const request = jsonRequest('https://example.com/api', { timeout: 10 });
    await expect(request).rejects.toMatchObject({
      name: 'TimeoutError',
      message: 'Request timeout after 10ms',
    });

    const fetchOptions = fetchMock.mock.calls[0][1];
    expect(fetchOptions.timeout).toBeUndefined();
    expect(fetchOptions.signal.aborted).toBe(true);
  });

  it('请求完成后应清理 timeout 定时器', async () => {
    jest.useFakeTimers();
    fetchMock.mockResolvedValue({
      ok: true,
      headers: { get: () => 'application/json' },
      json: async () => ({ success: true }),
    });

    try {
      await expect(jsonRequest('https://example.com/api', { timeout: 1000 })).resolves.toEqual({ success: true });
      const fetchOptions = fetchMock.mock.calls[0][1];
      jest.advanceTimersByTime(1000);
      expect(fetchOptions.signal.aborted).toBe(false);
    } finally {
      jest.useRealTimers();
    }
  });

  it('无效 URL 应抛出错误', async () => {
    await expect(jsonRequest('not-a-url')).rejects.toThrow('Invalid URL');
  });

  it('非 http/https 协议应抛出错误', async () => {
    await expect(jsonRequest('ftp://example.com')).rejects.toThrow('Unsupported URL protocol');
  });

  it('localhost 应被阻止', async () => {
    await expect(jsonRequest('http://localhost:8080')).rejects.toThrow('Blocked URL host');
  });

  it('127.0.0.1 应被阻止', async () => {
    await expect(jsonRequest('http://127.0.0.1:8080')).rejects.toThrow('Blocked URL host');
  });

  it('不合法的 content-type 应抛出错误', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      headers: { get: () => 'image/png' },
      json: async () => ({}),
    });
    await expect(jsonRequest('https://example.com/image.png')).rejects.toThrow('Invalid content-type');
  });
});

describe('buildRemoteRequestUrl', () => {
  it('应保留 target origin、base path 和正常 query 语义', () => {
    expect(buildRemoteRequestUrl('https://api.example.com:8443/v1', '/users?id=1&name=Jane+Doe')).toBe('https://api.example.com:8443/v1/users?id=1&name=Jane+Doe');
  });

  it('应规范化已编码的 path segment 和重复 query', () => {
    expect(buildRemoteRequestUrl('https://api.example.com/v1/', '/users/a%2Fb?tag=a%2Fb&tag=%E4%B8%AD%E6%96%87')).toBe(
      'https://api.example.com/v1/users/a%2Fb?tag=a%2Fb&tag=%E4%B8%AD%E6%96%87',
    );
    expect(buildRemoteRequestUrl('https://api.example.com/v1/', '/rates/100%25')).toBe('https://api.example.com/v1/rates/100%25');
  });

  it.each(['/../admin', '/%2e%2e/admin', '/.%2e/admin'])('应拒绝路径逃逸：%s', reqPath => {
    expect(() => buildRemoteRequestUrl('https://api.example.com/v1', reqPath)).toThrow('Remote request path traversal is not allowed');
  });

  it.each(['/%2e%2e%2fadmin', '/%2e%2e%5cadmin', '/safe%2f..%2fadmin', '/%252e%252e%252fadmin'])('应拒绝编码分隔符和多重编码形成的路径逃逸：%s', reqPath => {
    expect(() => buildRemoteRequestUrl('https://api.example.com/v1', reqPath)).toThrow('Remote request path traversal is not allowed');
  });

  it.each(['/%252e%252e%252fadmin%25', '/%252e%252e%252fadmin%25zz'])('尾随无效百分号不应掩盖路径逃逸：%s', reqPath => {
    expect(() => buildRemoteRequestUrl('https://api.example.com/v1', reqPath)).toThrow('Remote request path traversal is not allowed');
  });

  it('应保守拒绝超过安全解码层数的路径', () => {
    let deeplyEncodedPath = 'safe/value';
    for (let depth = 0; depth < 7; depth += 1) {
      deeplyEncodedPath = encodeURIComponent(deeplyEncodedPath);
    }
    expect(() => buildRemoteRequestUrl('https://api.example.com/v1', `/${deeplyEncodedPath}`)).toThrow('Remote request path traversal is not allowed');
  });

  it.each(['/users/%ZZ', '/users?name=%ZZ'])('应拒绝不合法的百分号编码：%s', reqPath => {
    expect(() => buildRemoteRequestUrl('https://api.example.com/v1', reqPath)).toThrow(URIError);
  });

  it.each(['//evil.example/path', 'https://evil.example/path', '\\\\evil.example/path'])('应拒绝绝对或协议相对路径：%s', reqPath => {
    expect(() => buildRemoteRequestUrl('https://api.example.com/v1', reqPath)).toThrow('Remote request path must be relative');
  });

  it('应拒绝 target 中的凭据、query 或 fragment', () => {
    expect(() => buildRemoteRequestUrl('https://user:pass@api.example.com/v1', '/users')).toThrow('Remote target URL must not include credentials, query, or fragment');
    expect(() => buildRemoteRequestUrl('https://api.example.com/v1?token=secret', '/users')).toThrow('Remote target URL must not include credentials, query, or fragment');
    expect(() => buildRemoteRequestUrl('https://api.example.com/v1#users', '/users')).toThrow('Remote target URL must not include credentials, query, or fragment');
  });
});
