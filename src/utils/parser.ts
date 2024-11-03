'use strict';

interface StompMsg {
  command: string;
  headers: Record<string, string>;
  body?: string;
}

/**
 * 解析 stomp 格式的数据
 * stomp 格式如下：
 * ```
 * COMMAND\n
 * HEADER1:VALUE1\n
 * HEADER2:VALUE2\n
 * ...\n
 * \n
 * BODY\n
 * ```
 * @param {string} stmopDataRaw 未经解析过的 stomp 格式的数据
 * @return {StompMsg}
 * @example
 * 比如：
 * ```
 * send\n
 * destination:/queue/test\n
 * content-type:text/plain\n
 * \n
 * hello world\n
 * ```
 * 解析后返回的对象如下：
 * {
 *   command: 'send',
 *   headers: {
 *     destination: '/queue/test',
 *     'content-type': 'text/plain',
 *   },
 *   body: 'hello world\n',
 * }
 */
export function parseStompMsg(stmopDataRaw: string) {
  const msg: StompMsg = {
    command: '',
    headers: {},
    body: '',
  };
  const lines = stmopDataRaw.split('\n');
  msg.command = lines[0];
  let bodyEnd = false;
  for (const line of lines) {
    if (line === '') {
      bodyEnd = true;
      continue;
    }
    if (bodyEnd) {
      msg.body += line + '\n';
    } else {
      const [key, value] = line.split(':');
      msg.headers[key] = value;
    }
  }
  msg.body = msg.body.trim();
  return msg;
}
