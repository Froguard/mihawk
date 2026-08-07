'use strict';
import { jsonRequest } from '../../../src/utils/request';

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
