'use strict';
import https from 'https';
import http, { IncomingMessage } from 'http';
import { promisify } from 'util';
import Colors from 'color-cc';
import * as WS from 'ws';
import { PKG_NAME } from '../consts';
// import { parseStompMsg } from '../utils/parser';
import { Debugger, Printer } from '../utils/print';
// import { delAddrProtocol } from '../utils/str';
import { getTimeNowStr } from '../utils/date';
import { /*getAddressByServer, getPortByServer, */ getAddrInfoByServer } from '../utils/server';

const LOGFLAG_WS = `${Colors.cyan('[WS]')}${Colors.gray(':')}`;

/**
 * wss 实例（web-sokcet-server）
 * WebSocketServer 实例，指的是 server 实例
 * - 【注意】
 */
export type WsWebScketServer = WS.WebSocketServer;

/**
 * ws 实例（webSocket）
 * WebSocket 实例
 * - 【注意】这里和 WebsocketServer 的实例，有区别，两者不是一个东西
 */
export type WsWebSocket = WS.WebSocket;

/**
 * ws 实例
 * alias for WS.WebSocket
 * - 便于理解，推荐直接使用 Scoket 这个类型
 */
export type Socket = WS.WebSocket; // alias

/**
 * socket 逻辑处理函数
 */
export type SocketResolveFunc = (socket: WS.WebSocket, request: IncomingMessage, clientId?: string) => void;

/**
 * 构造器传参
 */
export interface WsCtrlOptions {
  /**
   * ws-server 配置
   * @required
   */
  server: https.Server | http.Server;

  host: string;
  port: number;
  secure: boolean;

  // /**
  //  * 消息体数据，是否使用 stomp 协议，默认为 false
  //  */
  // stomp?: boolean; // TODO: 还没想好怎么暴露给用户使用

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
  // private _useStompMsg: boolean;
  private _host: string; // 主机名，仅为了打印输出
  private _port: number; // 端口，仅为了打印输出
  private _secure: boolean; // 协议安全，仅为了打印输出
  private _baseServer?: https.Server | http.Server;
  private _wsSvr?: WS.WebSocketServer | null; // 是一个 web socket sever 实例
  private _resolveFunc: SocketResolveFunc; // 自定义处理逻辑对应的函数
  private _clientIndex: number = 0; // 客户端连接的索引
  /**
   * 构造器
   */
  constructor(options: WsCtrlOptions) {
    const {
      // stomp = false,
      host,
      port,
      secure,
      server,
      resolve,
    } = options;
    // // useStompMsg
    // this._useStompMsg = !!stomp;
    this._host = host;
    this._port = port;
    this._secure = secure;
    // wss instance
    this._wsSvr = null;
    // base server (https/http server instance)
    this._baseServer = server;
    // logic resolve function
    const _resolve = typeof resolve === 'function' ? resolve : _defaultResolveFunc;
    this._resolveFunc = function (socket: WS.WebSocket, request: IncomingMessage, clientId?: string) {
      try {
        const funcCtx = socket; // 函数执行上下文 context
        _resolve.call(funcCtx, socket, request, clientId);
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
  public async start(server?: WS.ServerOptions['server']) {
    if (this._wsSvr) {
      Printer.log(LOGFLAG_WS, 'WS server is already running.');
      return;
    }
    const resolveFunc = this._resolveFunc;
    //
    if (server && _isHttpOrHttpsServer(server)) {
      this._baseServer = server; // 传入的 server 参数如果存在，则直接覆盖老的 server 参数
    }
    const { isSecure = this._secure, host = this._host, port = this._port } = _getBaseServerInfo(this._baseServer);
    const protocol = isSecure ? 'wss' : 'ws';
    //
    // 1.创建对应的 WebsocketServer 实例
    // 这里允许两种方案二选一（port+host 和 server）因为是冲突的，所以传 server 就不传 host/port
    this._wsSvr = new WS.WebSocketServer({ server: this._baseServer });
    //
    // 2.注册 wss 上的基础事件 (listerning,headers,connection,error,close)
    // 2.1.监听 WebSocket 服务器开始监听连接
    this._wsSvr.on('listening', function listening() {
      Printer.log(LOGFLAG_WS, 'WebSocket server is listening', `${protocol}://${host}:${port}`);
    });
    // 2.2.监听 headers 事件
    this._wsSvr.on('headers', function headers(headers, req) {
      Debugger.log('Headers:', headers);
      // 添加或修改响应头
      headers.push(`X-Powered-By: ${PKG_NAME}`);
    });
    // 2.3.监听 connection 事件：当有新的客户端连接时的处理
    this._wsSvr.on('connection', (socket: WS.WebSocket, request: IncomingMessage) => {
      const { remoteAddress, remotePort } = request?.socket || {};
      const clientId = remoteAddress ? `${remoteAddress}:${remotePort}__${getTimeNowStr()}` : this._autoCreateClientId();
      Printer.log(LOGFLAG_WS, 'Socket client connected!', Colors.gray(`clientId: ${clientId}`));
      // socket 实例上的一系列事件（通过外部提供的函数，进行自定义实现）
      resolveFunc(socket, request, clientId);
      //
    });
    // 2.4.监听 error 错误事件
    this._wsSvr.on('error', function error(err) {
      Printer.error(LOGFLAG_WS, 'WebSocket server error:', err);
    });
    // 2.5.监听 close 关闭事件
    this._wsSvr.on('close', function close() {
      Printer.log(LOGFLAG_WS, 'WebSocket server closed');
    });
    //
  }

  /**
   * 关闭/强行关闭 WebSocket 服务器
   * @param {boolean} forceClose 是否强制关闭
   */
  private async _close(forceClose = false) {
    if (!this._wsSvr) {
      Printer.log(LOGFLAG_WS, 'WebSocket server is not running.');
      return;
    }
    // 1.batch deal with all clients
    const clients = this._wsSvr?.clients;
    try {
      if (clients?.size) {
        if (forceClose) {
          clients?.forEach(client => client.terminate()); // destory
        } else {
          clients?.forEach(client => client.close()); // close
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
      this._wsSvr = null;
      Printer.log(LOGFLAG_WS, `WebSocket server was already ${forceClose ? 'destoryed' : 'closed'}.`);
    } catch (error) {
      Printer.error(LOGFLAG_WS, `${forceClose ? 'Destory' : 'Close'} WebSocket server failed!\n`, error);
    }
  }
  /**
   * close 函数
   * 关闭一个已经打开的套接字连接。它会尝试优雅地关闭连接，确保所有已发送的数据都被接收方接收
   * - 发送一个 FIN 包给对方，表示本端不再发送数据。
   * - 允许接收来自对端的数据，直到对端也关闭连接。
   * - 关闭连接后，会触发 close 事件
   */
  public async close() {
    return await this._close();
  }

  /**
   * destory 函数
   * 强行/强制的关闭一个打开的套接字，并释放所有相关资源，且不考虑进行正常的关闭握手过程
   * - 立即关闭连接，不等待未发送的数据被发送或接收
   * - 释放所有与套接字关联的资源
   * - 关闭连接后，会触发 close 事件
   * - 如果有未处理的错误，可能会触发 error 事件
   */
  public async destory() {
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
function _defaultResolveFunc(socket: WS.WebSocket, request: IncomingMessage, clientId?: string) {
  clientId = clientId || request.socket.remoteAddress;
  const clientName = `[${clientId}]`;
  socket.send(`Hi, ${clientName}`);
  // open
  socket.on('open', () => {
    Printer.log(LOGFLAG_WS, clientName, `Client ${Colors.gray(clientId)} open.`);
  });
  // message
  socket.on('message', (message: any, isBinary: boolean) => {
    Printer.log(LOGFLAG_WS, clientName, `Received message => ${message}`, isBinary ? Colors.gray('binary') : '');
    socket.send(`SocketServer: I have recived your message -> ${message}`); // send response
  });
  // upgrade
  socket.on('upgrade', (request: IncomingMessage) => {
    const clientAddr = request.socket.remoteAddress;
    Printer.log(LOGFLAG_WS, clientName, `Client ${clientAddr} upgraded.`);
  });
  // ping
  socket.on('ping', (data: Buffer) => {
    Printer.log(LOGFLAG_WS, clientName, `Received ping => ${data}`);
    socket.pong(`Pong: ${data?.toString()}`); // pong
  });
  // pong
  socket.on('pong', (data: Buffer) => {
    Printer.log(LOGFLAG_WS, clientName, `Received pong => ${data?.toString()}`);
  });
  // error
  socket.on('error', (err: Error) => {
    Printer.error(LOGFLAG_WS, clientName, `CLient error: ${err.message}`);
  });
  // unexpected-response
  socket.on('unexpected-response', (request: IncomingMessage, response: IncomingMessage) => {
    Printer.error(LOGFLAG_WS, clientName, `CLient unexpected-response: ${response.statusCode} ${response.statusMessage}`);
  });
  // close
  socket.on('close', (code: number, reason: Buffer) => {
    Printer.log(LOGFLAG_WS, clientName, `Client close connection.(with code=${code},reason=${reason.toString()})`);
  });
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
