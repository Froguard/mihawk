'use strict';
import https from 'https';
import http, { IncomingMessage } from 'http';
import { promisify } from 'util';
import Colors from 'color-cc';
import * as WS from 'ws';
import { PKG_NAME } from '../consts';
import { parseStompMsg, StompMsg } from '../utils/parser';
import { Printer } from '../utils/print';
import { getTimeNowStr } from '../utils/date';
import { getAddrInfoByServer } from '../utils/server';
import { getMyIp, supportLocalHost } from '../utils/net';
import type { SocketResolveFunc, SocketReslrFuncOptions } from '../com-types';

const LOGFLAG_WS = `${Colors.cyan('[WS]')}${Colors.gray(':')}`;

/**
 * 构造器传参
 */
export interface WsCtrlOptions {
  /**
   * ws-server 配置
   * @required
   */
  server: https.Server | http.Server;

  /**
   * 监听地址
   */
  host: string;

  /**
   * 监听端口
   */
  port: number;

  /**
   * 是否使用 https 协议
   */
  secure: boolean;

  /**
   * 消息体数据，是否使用 stomp 协议，默认为 false
   */
  stomp?: boolean;

  /**
   * 自定义 socket 逻辑处理函数
   * @param {WS.WebSocket} socket
   * @param {IncomingMessage} request
   * @returns
   */
  resolve?: SocketResolveFunc;
}

/**
 * websocket 服务端相关操作的二次封装，class 类
 */
export default class WsCtrl {
  private _useStompMsg: boolean;
  private _host: string; // 主机名，仅为了打印输出
  private _port: number; // 端口，仅为了打印输出
  private _secure: boolean; // 协议安全，仅为了打印输出
  private _baseServer?: https.Server | http.Server;
  private _wsSvr?: WS.WebSocketServer | null; // 是一个 web socket sever 实例
  private _clientIndex: number = 0; // 客户端连接的索引
  private _resolveFunc: SocketResolveFunc; // 自定义处理逻辑对应的函数

  /**
   * new 操作构造器
   */
  constructor(options: WsCtrlOptions) {
    const {
      host,
      port,
      secure = false, //
      server,
      stomp = false, //
      resolve = _defaultResolveFunc, //
    } = options;
    // useStompMsg
    this._useStompMsg = !!stomp;
    // host,port,secure (only for log print)
    this._host = host;
    this._port = port;
    this._secure = secure;
    // wss instance
    this._wsSvr = null;
    // base server (https/http server instance)
    this._baseServer = server;
    // logic resolve function
    const _resolve = typeof resolve === 'function' ? resolve : _defaultResolveFunc;
    this._resolveFunc = function (socket: WS.WebSocket, request: IncomingMessage, options?: SocketReslrFuncOptions) {
      try {
        const funcCtx = socket; // 函数执行上下文 context
        _resolve.call(funcCtx, socket, request, options);
      } catch (error) {
        Printer.error(LOGFLAG_WS, 'Failed to exec socket logic resolveFunc:\n', error);
      }
    };
  }

  /**
   * 创建一个 client ID
   * @returns {string}
   */
  private _autoCreateClientId() {
    return `Client-${++this._clientIndex}__${getTimeNowStr()}`;
  }

  /**
   * start 函数
   */
  public async start(server?: WS.ServerOptions['server'], isRestart?: boolean) {
    if (this._wsSvr) {
      Printer.log(LOGFLAG_WS, 'WS server is already running.');
      return;
    }
    const resolveFunc = this._resolveFunc;
    const stomp = this._useStompMsg;
    //
    if (server && _isHttpOrHttpsServer(server)) {
      this._baseServer = server; // 传入的 server 参数如果存在，则直接覆盖老的 server 参数
    }
    const { isSecure = this._secure, host = this._host, port = this._port } = _getBaseServerInfo(this._baseServer);
    const protocol = isSecure ? 'wss' : 'ws';
    const hostFix = host === '0.0.0.0' ? '127.0.0.1' : host;
    /**
     * 1.创建对应的 WebsocketServer 实例
     * 这里允许两种方案二选一（port+host 和 server）因为是冲突的，所以传 server 就不传 host/port
     */
    this._wsSvr = new WS.WebSocketServer({ server: this._baseServer });
    // const logPrefix = Colors.gray('WsServer:');

    /**
     * 2.注册 wss 上的基础事件 (listerning,headers,connection,error,close)
     */
    // 2.1.监听 WebSocket 服务器开始监听连接
    this._wsSvr.on('listening', function listening() {
      Printer.log(/*LOGFLAG_WS, */ `🚀 ${Colors.green(`${isRestart ? 'Restart' : 'Start'} mock-socket-server success!`)}`);
      !isRestart && Printer.log(`Mock Socket Server address:`);
      Printer.log(/*LOGFLAG_WS, */ `${Colors.gray('-')} ${Colors.cyan(`${protocol}://${hostFix}:${port}`)}`);
      if (supportLocalHost(host)) {
        const addr2 = `${protocol}://${getMyIp()}:${port}`;
        Printer.log(`${Colors.gray('-')} ${Colors.cyan(addr2)}`);
      }
      console.log();
    });

    // 2.2.监听 headers 事件
    this._wsSvr.on('headers', function headers(headers, req) {
      // Printer.log(LOGFLAG_WS, 'Headers:', headers);
      headers.push(`X-Powered-By: ${PKG_NAME}`); // 添加或修改响应头
    });

    // 2.3.监听 connection 事件：当有新的客户端连接时的处理
    this._wsSvr.on('connection', (socket: WS.WebSocket, request: IncomingMessage) => {
      const { remoteAddress, remotePort } = request?.socket || {};
      const clientId = remoteAddress ? `${remoteAddress}:${remotePort || ++this._clientIndex}` : this._autoCreateClientId();
      Printer.log(LOGFLAG_WS, 'Socket client connected!', Colors.gray(`clientId=[${clientId}]`), Colors.gray(`time=${getTimeNowStr()}`));
      /**
       * 调用自定义函数
       * socket 实例上的一系列事件（通过外部提供的函数，进行自定义实现）
       */
      resolveFunc(socket, request, { clientId, stomp });
      /**
       * 🔥 主动触发一下 open 事件，以便于如果 resolveFunc 函数中，如果针对 socket 对象进行了监听 open 事件能够执行
       */
      setTimeout(() => {
        const clientId4Log = Colors.gray(`clientId=[${clientId}]`);
        const timeNow4Log = Colors.gray(`time=${getTimeNowStr()}`);
        if (this._wsSvr) {
          try {
            socket?.emit('open', () => {
              // eslint-disable-next-line
              Printer.log(LOGFLAG_WS, "Socket client opened! (socket.emit('open') success!)", clientId4Log, timeNow4Log); // prettier-ignore
            });
          } catch (error) {
            Printer.error(LOGFLAG_WS, "Failed to exec socket.emit('open') ! ", clientId4Log, timeNow4Log, '\n', error);
          }
        } else {
          Printer.warn(LOGFLAG_WS, "Cancel to exec socket.emit('open'), because connection is closed.", clientId4Log, timeNow4Log);
        }
      }, 0);
      //
    });

    // 2.4.监听 error 错误事件
    this._wsSvr.on('error', function error(err) {
      Printer.error(LOGFLAG_WS, 'WebSocket server error:', err);
    });

    // 2.5.监听 close 关闭事件
    this._wsSvr.on('close', function close() {
      // Printer.log(LOGFLAG_WS, 'WebSocket server was closed!');
    });
    //
  }

  /**
   * 关闭/强行关闭 WebSocket 服务器
   * - 注意：这里并不会对其 baseServer 进行关闭，只是关闭了 WebSocket 服务器（baseServer的关闭和销毁操作放到另外的地方）
   * @param {boolean} forceClose 是否强制关闭
   */
  async _close(forceClose = false) {
    if (!this._wsSvr) {
      Printer.log(LOGFLAG_WS, 'WebSocket server is not running.');
      return;
    }
    // 1.batch deal with all clients
    const clients = this._wsSvr?.clients;
    try {
      if (clients?.size) {
        if (forceClose) {
          clients?.forEach(client => client?.terminate()); // destroy
        } else {
          clients?.forEach(client => client?.close()); // close
        }
      }
    } catch (error) {
      Printer.error(LOGFLAG_WS, `Batch ${forceClose ? 'terminate' : 'close'} clients failed!\n`, error);
    }
    //
    // 2.close websocket server
    const closeAsync = promisify(this._wsSvr.close).bind(this._wsSvr);
    try {
      await closeAsync();
      this._wsSvr = null; // 成功销毁之后需要进行置空处理
      // Printer.log(LOGFLAG_WS, `WebSocket server was already ${forceClose ? 'destroyed' : 'closed'}.`);
    } catch (error) {
      Printer.error(LOGFLAG_WS, `${forceClose ? 'Destroy' : 'Close'} WebSocket server failed!\n`, error);
    }
  }
  /**
   * close 函数
   * 关闭一个已经打开的套接字连接。它会尝试优雅地关闭连接，确保所有已发送的数据都被接收方接收
   * - 发送一个 FIN 包给对方，表示本端不再发送数据。
   * - 允许接收来自对端的数据，直到对端也关闭连接。
   * - 关闭连接后，会触发 wsSvr 的 close 事件
   */
  public async close() {
    return await this._close();
  }

  /**
   * destroy 函数
   * 强行/强制的关闭一个打开的套接字，并释放所有相关资源，且不考虑进行正常的关闭握手过程
   * - 立即关闭连接，不等待未发送的数据被发送或接收
   * - 释放所有与套接字关联的资源
   * - 关闭连接后，会触发 wsSvr 的 close 事件
   * - 如果有未处理的错误，可能会触发 wsSvr 的 error 事件
   */
  public async destroy() {
    return await this._close(true);
  }
}

//
//
// ===================================================== private functions ==========================================================
//
//
/**
 * 默认的 resolve 函数
 * @param {WS.WebSocket} socket
 * @param {IncomingMessage} request
 */
function _defaultResolveFunc(socket: WS.WebSocket, request: IncomingMessage, options?: SocketReslrFuncOptions) {
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
    let recivedData: string | StompMsg = recived;
    if (stomp) {
      recivedData = parseStompMsg(recived);
      Printer.log(LOGFLAG_WS, logName, 'Received stomp message', logTail);
      Printer.log(LOGFLAG_WS, logName, '<= stompData:', recivedData);
    } else {
      Printer.log(LOGFLAG_WS, logName, `Received message <= "${Colors.green(recived)}"`, isBinary ? Colors.gray('binary') : '', logTail);
    }
    // struct response data
    const recivedDataStr = typeof recivedData === 'string' ? recivedData : JSON.stringify(recivedData);
    const msgData = {
      success: true,
      data: `WsServer: I've recived your message(${recivedDataStr})`,
    };
    // send response
    Printer.log(LOGFLAG_WS, logName, `Send response to ${Colors.gray(clientName)} =>`, msgData);
    socket.send(JSON.stringify(msgData));
    console.log('\n');
  });

  // open
  socket.on('open', () => {
    Printer.log(LOGFLAG_WS, logName, `Client ${Colors.gray(clientId)} open.`, logTail);
  });

  // upgrade
  socket.on('upgrade', (request: IncomingMessage) => {
    const clientAddr = request.socket.remoteAddress;
    Printer.log(LOGFLAG_WS, logName, `Client ${clientAddr} upgraded.`, logTail);
  });

  // ping
  socket.on('ping', (data: Buffer) => {
    Printer.log(LOGFLAG_WS, logName, `Received ping => ${data?.toString() || ''}`, logTail);
    socket.pong(`Pong: ${data?.toString()}`); // pong
  });

  // pong
  socket.on('pong', (data: Buffer) => {
    Printer.log(LOGFLAG_WS, logName, `Received pong => ${data?.toString() || ''}`, logTail);
  });

  // error
  socket.on('error', (err: Error) => {
    const errMsg = err?.message || err?.toString() || 'unknow error';
    Printer.error(LOGFLAG_WS, logName, `CLient error: ${Colors.red(errMsg)}`, logTail);
    Printer.error(LOGFLAG_WS, err, '\n');
  });

  // unexpected-response
  socket.on('unexpected-response', (request: IncomingMessage, response: IncomingMessage) => {
    const exceptDetail = `${response.statusCode} ${response.statusMessage}`;
    Printer.error(LOGFLAG_WS, logName, `CLient unexpected-response: ${Colors.red(exceptDetail)}`, logTail, '\n');
  });

  // close
  socket.on('close', (code: number, reason: Buffer) => {
    const closeDetail = `code=${code},reason=${reason.toString() || 'none'}`;
    Printer.log(LOGFLAG_WS, logName, `Client close connection.(${Colors.yellow(closeDetail)})`, logTail, '\n');
  });
  //
}

/**
 * 获取基础服务器信息
 * - 注意：server 如果未完全启动（调用 listen 函数），此时获取到的 host 和 port 均为空
 * @param {http.Server | https.Server} server
 * @returns {{ isSecure: boolean; protocol: string; host: string; port: string }}
 */
function _getBaseServerInfo(server: http.Server | https.Server) {
  const isSecure = server instanceof https.Server;
  const protocol = isSecure ? 'https' : 'http';
  const { port, address } = getAddrInfoByServer(server) || {};
  return { isSecure, protocol, host: address, port };
}

/**
 * 判断 server 是否为 http/https 服务器实例之一
 * @param {unknown} server
 * @returns {boolean}
 */
function _isHttpOrHttpsServer(server: unknown): server is http.Server | https.Server {
  return server instanceof http.Server || server instanceof https.Server;
}
