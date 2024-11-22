/**
 * 临时测试代码
 */
import http, { IncomingMessage } from 'http';
import WsCtrl, { WsWebSocket } from '../src/composites/websocket';

const port = 8080;
const host = '0.0.0.0';

// create http server
const server = http.createServer((req, res) => {
  res.end('hello');
});
server.listen(port, host);

// create ws server controller
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

// 10s 后关闭
setTimeout(async () => {
  //
  // close ws server
  await ws.close();
  // close http server
  server.close();
  //
  //
  // force quit process 如果上面正常关闭，是不需要显式书写这个强制退出语句的
  // process.exit(0);
}, 10000);
