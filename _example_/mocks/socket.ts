import { IncomingMessage } from 'http';
import Colors from 'color-cc';
import { WsWebSocket, SocketReslrFuncOptions } from 'mihawk/com-types';

/**
 * 默认的 resolve 函数
 * @param {WS.WebSocket} socket
 * @param {IncomingMessage} request
 */
export default function socketResolver(socket: WsWebSocket, request: IncomingMessage, options?: SocketReslrFuncOptions) {
  const { clientId: cid, stomp } = options || {};
  const clientId = cid || request.socket.remoteAddress;
  const clientName = `[${clientId}]`;
  const logTail = Colors.gray(`from ${clientName}`);
  const logName = Colors.gray('socket:');

  // ★ send a test msg
  socket.send(JSON.stringify({ success: true, data: `WsServer: Connection established! Hello, client! ${clientName}` }));

  // ★ message
  socket.on('message', (message: any, isBinary: boolean) => {
    const recived = typeof message === 'string' ? message : Buffer.isBuffer(message) ? message?.toString() : JSON.stringify(message);
    console.log(logName, `Received message <= "${Colors.green(recived)}"`, isBinary ? Colors.gray('binary') : '', logTail);
    // struct response data
    const msgData = {
      success: true,
      data: `WsServer: I've recived your message(${JSON.stringify(recived)})`,
    };
    // send response
    console.log(logName, `Send response to ${Colors.gray(clientName)} =>`, msgData);
    socket.send(JSON.stringify(msgData));
  });

  // open
  socket.on('open', () => {
    console.log(logName, `Client ${Colors.gray(clientId)} open.`, logTail);
  });

  // error
  socket.on('error', (err: Error) => {
    const errMsg = err?.message || err?.toString() || 'unknow error';
    console.error(logName, `CLient error: ${Colors.red(errMsg)}`, logTail);
    console.error(err, '\n');
  });

  // close
  socket.on('close', (code: number, reason: Buffer) => {
    const closeDetail = `code=${code},reason=${reason.toString() || 'none'}`;
    console.log(logName, `Client close connection.(${Colors.yellow(closeDetail)})`, logTail, '\n');
  });
  //
}
