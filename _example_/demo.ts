/**
 * 临时测试代码
 * 命令行中执行 yarn dev 即可
 */
// import { singleSelectInCli } from '../src/utils/cli';
// import deepMerge from 'deepmerge';

import http, { IncomingMessage } from 'http';
import WsCtrl, { WsWebSocket } from '../src/composites/websocket';

const port = 8080;
const host = '0.0.0.0';

const server = http.createServer((req, res) => {
  res.end('hello');
});
server.listen(port, host);
const ws = new WsCtrl({
  host,
  port,
  secure: false,
  server,
  // resolve: (socket: WsWebSocket, request: IncomingMessage) => {
  //   console.log('socket', socket);
  //   console.log('request', request);
  // },
});
ws.start();

// async function main() {
//   const result = await singleSelectInCli('请选择', [
//     { title: '1', value: 1 },
//     { title: '2', value: 2 },
//     { title: '3', value: 3 },
//   ]);
//   console.log('result', result);
// }

// main();

// const a = { x: 1, y: 2 };
// const b = { x: 2, y: 'hello', z: 3 };
// deepMerge(a, b);
// console.log('a', a);
