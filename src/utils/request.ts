/**
 * 发起 HTTP 请求并将响应解析为 JSON。
 *
 * `options.timeout` 为正数时，使用函数内部创建的 AbortController 中断超时请求；
 * 调用方传入的 `signal` 不会透传给 fetch。
 *
 * @param {string} url 请求地址
 * @param {Record<string, any>} [options] 请求配置，可额外传入毫秒数 `timeout`
 * @returns {Promise<R>} 解析后的响应数据
 * @throws {Error} URL 无效、请求超时、网络请求失败或响应格式无效时抛出
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
  const { timeout, ...fetchOptions } = options;
  const hasTimeout = typeof timeout === 'number' && Number.isFinite(timeout) && timeout > 0;
  const abortController = hasTimeout ? new AbortController() : null;
  let timeoutTimer: ReturnType<typeof setTimeout> | null = null;
  let didTimeout = false;

  if (abortController) {
    timeoutTimer = setTimeout(() => {
      didTimeout = true;
      abortController.abort();
    }, timeout);
  }

  try {
    // send api
    const apiRes = await fetch(url, {
      ...fetchOptions, // overwrite
      signal: abortController?.signal,
      headers: {
        ...fetchOptions?.headers, // overwrite
        'Content-Type': 'application/json', // force set json type
        Cookie: fetchOptions.headers?.Cookie,
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
  } catch (error) {
    if (didTimeout) {
      const timeoutError = new Error(`Request timeout after ${timeout}ms`);
      timeoutError.name = 'TimeoutError';
      throw timeoutError;
    }
    throw error;
  } finally {
    if (timeoutTimer) {
      clearTimeout(timeoutTimer);
    }
  }
}

/**
 * 规范化请求配置，并移除 GET、HEAD 请求不应携带的请求体和内容长度。
 *
 * @param {Record<string, any>} [options] 待规范化的请求配置
 * @param {boolean} [isHttps] 是否为 HTTPS 请求，保留用于兼容现有调用
 * @returns {Record<string, any>} 规范化后的请求配置
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

/**
 * 解码 URL 组件。
 *
 * @param {string} value 待解码的 URL 组件
 * @param {boolean} [plusAsSpace=false] 是否将加号按查询参数中的空格处理
 * @returns {string} 解码后的字符串
 * @throws {URIError} 包含非法百分号编码时抛出
 */
function decodeUrlComponent(value: string, plusAsSpace: boolean = false) {
  return decodeURIComponent(plusAsSpace ? value.replace(/\+/g, ' ') : value);
}

/**
 * 将查询参数组件规范化为安全的百分号编码。
 *
 * @param {string} value 待编码的查询参数组件
 * @returns {string} 规范化后的查询参数组件
 * @throws {URIError} 包含非法百分号编码时抛出
 */
function encodeQueryComponent(value: string) {
  return encodeURIComponent(decodeUrlComponent(value, true)).replace(/%20/g, '+');
}

/**
 * 判断字符串是否包含独立的当前目录或上级目录路径段。
 *
 * @param {string} value 待检查的路径内容
 * @returns {boolean} 包含 `.` 或 `..` 路径段时返回 true
 */
function containsTraversalSegment(value: string) {
  return value.split(/[\\/]/).some(segment => segment === '.' || segment === '..');
}

/** 路径穿越检测允许的最大百分号解码层数，超过后按危险路径处理。 */
const MAX_PATH_DECODE_DEPTH = 5;

/**
 * 解码一层 ASCII 百分号编码，非法编码保持原样以避免检查提前结束。
 *
 * @param {string} value 待检查的路径内容
 * @returns {string} 解码一层后的路径内容
 */
function decodeAsciiPercentTriplets(value: string) {
  return value.replace(/%[0-7][0-9a-f]/gi, encodedByte => String.fromCharCode(Number.parseInt(encodedByte.slice(1), 16)));
}

/**
 * 在有限次百分号解码的每一层检查路径穿越片段。
 *
 * 达到最大解码层数后仍可继续解码时，保守地将路径判定为危险。
 *
 * @param {string} value 已完成首次 URL 解码的路径组件
 * @returns {boolean} 存在路径穿越或编码层数超限时返回 true
 */
function containsPathTraversal(value: string) {
  let decodedValue = value;
  for (let depth = 0; depth < MAX_PATH_DECODE_DEPTH; depth += 1) {
    if (containsTraversalSegment(decodedValue)) {
      return true;
    }
    const nextDecodedValue = decodeAsciiPercentTriplets(decodedValue);
    if (nextDecodedValue === decodedValue) {
      return false;
    }
    decodedValue = nextDecodedValue;
  }
  // 超过限定层数仍存在编码内容时，拒绝该路径。
  return true;
}

/**
 * 基于可信远端目标构造受限的请求 URL。
 *
 * 请求路径和查询参数会按组件重新编码，最终 URL 必须保持目标的协议、域名、
 * 端口及基础路径；不允许绝对路径、路径穿越以及目标中的凭据、查询或片段。
 *
 * @param {string} target 可信配置中的远端目标地址
 * @param {string} reqPath 来自当前请求的相对路径和查询参数
 * @returns {string} 规范化且受目标范围约束的绝对 URL
 * @throws {Error} 目标地址或请求路径不符合安全约束时抛出
 */
export function buildRemoteRequestUrl(target: string, reqPath: string) {
  // 远端目标只允许固定的 HTTP(S) origin 和基础路径。
  const targetUrl = new URL(target);
  if (targetUrl.protocol !== 'http:' && targetUrl.protocol !== 'https:') {
    throw new Error(`Unsupported URL protocol: ${targetUrl.protocol}`);
  }
  if (targetUrl.username || targetUrl.password || targetUrl.search || targetUrl.hash) {
    throw new Error('Remote target URL must not include credentials, query, or fragment');
  }

  // 请求路径只作为相对路径处理，片段不会发送到远端服务。
  const pathAndQuery = reqPath.replace(/\\/g, '/').split('#', 1)[0];
  if (/^[a-z][a-z\d+.-]*:/i.test(pathAndQuery) || pathAndQuery.startsWith('//')) {
    throw new Error('Remote request path must be relative');
  }

  const queryIndex = pathAndQuery.indexOf('?');
  const rawPath = queryIndex === -1 ? pathAndQuery : pathAndQuery.slice(0, queryIndex);
  const rawQuery = queryIndex === -1 ? '' : pathAndQuery.slice(queryIndex + 1);
  // 分别编码每个路径段，避免不可信内容改变路径层级。
  const safePath = rawPath
    .replace(/^\/+/, '')
    .split('/')
    .map(segment => {
      const decodedSegment = decodeUrlComponent(segment);
      if (containsPathTraversal(decodedSegment)) {
        throw new Error('Remote request path traversal is not allowed');
      }
      return encodeURIComponent(decodedSegment);
    })
    .join('/');
  // 分别编码查询参数的键和值，避免其进入 URL 结构部分。
  const safeQuery = rawQuery
    .split('&')
    .map(parameter => {
      const equalsIndex = parameter.indexOf('=');
      if (equalsIndex === -1) {
        return encodeQueryComponent(parameter);
      }
      const key = encodeQueryComponent(parameter.slice(0, equalsIndex));
      const value = encodeQueryComponent(parameter.slice(equalsIndex + 1));
      return `${key}=${value}`;
    })
    .join('&');

  // 构造完成后再次验证 origin 和基础路径没有被改变。
  const basePath = targetUrl.pathname.endsWith('/') ? targetUrl.pathname : `${targetUrl.pathname}/`;
  const requestUrl = new URL(targetUrl.toString());
  requestUrl.pathname = `${basePath}${safePath}`;
  requestUrl.search = rawQuery ? `?${safeQuery}` : '';
  requestUrl.hash = '';
  if (requestUrl.origin !== targetUrl.origin || !requestUrl.pathname.startsWith(basePath)) {
    throw new Error('Remote request URL escaped the configured target');
  }
  return requestUrl.toString();
}
