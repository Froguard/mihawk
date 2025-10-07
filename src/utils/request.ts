import crossFetch from 'cross-fetch';

/**
 * 接口的响应为 json 格式的请求
 * @param {string} url
 * @param {RequestInit} options
 * @returns {Promise<R>} res
 * @description
 */
export async function jsonRequest<R = Record<string, any>>(url: string, options?: Record<string, any>) {
  const nodeFetch = (await import('node-fetch')).default;
  console.log('crossFetch: ', typeof crossFetch, ',nodeFetch:', typeof nodeFetch);
  const apiRes = await nodeFetch(url, {
    // const apiRes = await crossFetch(url, {
    method: 'GET',
    ...options, // overwrite
    headers: {
      ...options?.headers, // overwrite
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
