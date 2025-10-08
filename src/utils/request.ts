import https from 'https';

const httpsAgent = new https.Agent({
  minVersion: 'TLSv1.2',
});

/**
 * 接口的响应为 json 格式的请求
 * @param {string} url
 * @param {RequestInit} options
 * @returns {Promise<R>} res
 * @description
 */
export async function jsonRequest<R = Record<string, any>>(url: string, options?: Record<string, any>) {
  const nodeFetch = (await import('node-fetch')).default;

  // format options
  const isHttps = url.startsWith('https://');
  options = formatOptions(options, isHttps);

  // send api
  const apiRes = await nodeFetch(url, {
    // const apiRes = await crossFetch(url, {
    ...options, // overwrite
    headers: {
      ...options?.headers, // overwrite
      'Content-Type': 'application/json', // force set json type
    },
  });

  // resolve exceptions
  if (!apiRes.ok || apiRes.status !== 200) {
    throw new Error(`HTTP Error: ${apiRes.status}`);
  }
  if (apiRes.headers.get('content-type') !== 'application/json') {
    throw new Error('Invalid content-type');
  }

  // parse to json
  const res = await apiRes.json();
  return res as R;
}

function formatOptions(options?: Record<string, any>, isHttps?: boolean) {
  options = options || {};
  // method
  options.method = options.method || 'GET';
  // body
  if (['HEAD', 'GET'].includes(options.method)) {
    delete options.body;
  }
  // agent
  if (isHttps) {
    options.agent = httpsAgent;
  }

  return options;
}
