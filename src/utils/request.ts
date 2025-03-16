import nodeFetch, { type RequestInit } from 'node-fetch'; // @^2.6.11
/**
 * 接口的响应为 json 格式的请求
 * @param {string} url
 * @param {RequestInit} options
 * @returns {Promise<R>} res
 * @description
 */
export async function jsonRequest<R = Record<string, any>>(url: string, options?: RequestInit) {
  const apiRes = await nodeFetch(url, {
    method: 'GET',
    ...options, // overwrite
    headers: {
      ...options?.headers,
      'Content-Type': 'application/json', // force set json type
    },
  });
  if (!apiRes.ok || apiRes.status !== 200) {
    throw new Error(`HTTP Error: ${apiRes.status}`);
  }
  if (apiRes.headers.get('content-type') !== 'application/json') {
    throw new Error('Invalid content-type');
  }
  const res = await apiRes.json();
  return res as R;
}
