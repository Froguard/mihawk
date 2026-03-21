// import { fetch } from 'undici';

/**
 * 接口的响应为 json 格式的请求
 * @param {string} url
 * @param {RequestInit} options
 * @returns {Promise<R>} res
 * @description
 */
export async function jsonRequest<R = Record<string, any>>(url: string, options?: Record<string, any>) {
  // basic SSRF mitigation: only allow http/https URLs and block obvious loopback hosts
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    throw new Error(`Invalid URL: ${url}`);
  }
  const protocol = parsedUrl.protocol;
  if (protocol !== 'http:' && protocol !== 'https:') {
    throw new Error(`Unsupported URL protocol: ${protocol}`);
  }
  const hostname = parsedUrl.hostname.toLowerCase();
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') {
    throw new Error(`Blocked URL host: ${hostname}`);
  }

  // format options
  const isHttps = url.startsWith('https://');
  options = formatOptions(options, isHttps);

  // send api
  const apiRes = await fetch(url, {
    // const apiRes = await crossFetch(url, {
    ...options, // overwrite
    headers: {
      ...options?.headers, // overwrite
      'Content-Type': 'application/json', // force set json type
      Cookie: options.headers.Cookie,
    },
  });

  // resolve exceptions
  // if (!apiRes.ok) {
  //   throw new Error(`HTTP Error: ${apiRes.status}`);
  // }
  const resContentType = apiRes.headers.get('content-type') || apiRes.headers.get('Content-Type') || '';
  if (!resContentType || (!resContentType.includes('application/json') && !resContentType.includes('json') && !resContentType.includes('text'))) {
    throw new Error(`Invalid content-type: ${resContentType || 'unknown'}`);
  }

  // parse to json
  const res = await apiRes.json();
  return res as R;
}

/**
 * format request options
 * @param {object} options
 * @param {boolean} isHttps
 * @returns {object} options
 */
function formatOptions(options?: Record<string, any>, isHttps?: boolean) {
  options = options || {};

  // method
  options.method = (options.method || 'GET') as string;

  // body
  if (['HEAD', 'GET'].includes(options.method.toUpperCase())) {
    delete options.body;
  }

  // content-length
  if (options.headers?.['Content-Length']) {
    delete options.headers['Content-Length'];
  }
  if (options.headers?.['content-length']) {
    delete options.headers['content-length'];
  }

  return options;
}
