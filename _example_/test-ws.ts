/**
 * 临时测试代码
 */
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
