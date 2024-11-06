'use strict';
import { IncomingMessage } from 'http';
import Colors from 'color-cc';
import * as WS from 'ws';
import { PKG_NAME } from '../consts';
import { parseStompMsg } from '../utils/parser';
import { Debugger, Printer } from '../utils/print';
import { createRandId } from '../utils/str';
import { getTimeNowStr } from '../utils/date';
import { getAddressByServer, getPortByServer } from '../utils/server';

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
export type SocketResolveFunc = (socket: WS.WebSocket, request: IncomingMessage) => void;

/**
 * 构造器传参
 */
export interface WsCtrlOptions {
  /**
   * http/https 服务对应的 ip 地址
   */
  address?: string;
  /**
   * http/https 服务端口
   */
  port?: number;

  /**
   * 消息体数据，是否使用 stomp 协议，默认为 false
   */
  stomp?: boolean; // TODO: 还没想好怎么暴露给用户使用

  /**
   * ws 配置
   */
  wssOptions?: WS.ServerOptions;

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
  private useStompMsg: boolean;
  private address: string; // http/https 服务对应地址
  private port: number; // http/https 服务对应端口
  private resolveFunc: SocketResolveFunc; // 自定义处理逻辑对应的函数
  private wss?: WS.WebSocketServer | null; // 是一个 web socket sever 实例
  private wssOptions: WS.ServerOptions; // 创建 wss 实例所需要的 options 配置
  /**
   * 构造器
   */
  constructor(options: WsCtrlOptions) {
    const { stomp = false, resolve, wssOptions, address, port } = options;
    // useStompMsg
    this.useStompMsg = !!stomp;
    // logic resolve function
    this.resolveFunc = typeof resolve === 'function' ? resolve : _defaultResolveFunc;
    // wss instance
    this.wss = null;
    // wss options
    this.wssOptions = wssOptions || {};
    // address
    this.address = _removeProtocol(address || getAddressByServer(this.wssOptions.server)) || '127.0.0.1';
    // port
    this.port = port || getPortByServer(this.wssOptions.server) || 0;
  }

  /**
   * start 函数
   */
  public start() {
    if (this.wss) {
      Printer.log(LOGFLAG_WS, 'WS server is already running.');
      return;
    }
    const port = this.port;
    const addr = this.address;
    const resolveFunc = this.resolveFunc;
    //
    // 1.创建对应的 WebsocketServer 实例
    this.wss = new WS.WebSocketServer(this.wssOptions);
    // 2.注册 wss 上的基础事件 (listerning,headers,connection,error,close)
    // 2.1.监听 WebSocket 服务器开始监听连接
    this.wss.on('listening', function listening() {
      Printer.log(LOGFLAG_WS, 'WebSocket server is listening', `wss://${addr}:${port}`);
    });
    // 2.2.监听 headers 事件
    this.wss.on('headers', function headers(headers, req) {
      Debugger.log('Headers:', headers);
      // 添加或修改响应头
      headers.push(`X-Powered-By: ${PKG_NAME}`);
    });
    // 2.3.监听 connection 事件：当有新的客户端连接时的处理
    this.wss.on('connection', (socket: WS.WebSocket, request: IncomingMessage) => {
      const { remoteAddress, remotePort } = request?.socket || {};
      const clientId = remoteAddress ? `${remoteAddress}:${remotePort}_${getTimeNowStr()}` : _createClientId();
      Printer.log(LOGFLAG_WS, 'Socket client connected!', Colors.gray(`clientId: ${clientId}`));
      // socket 实例上的一系列事件（通过外部提供的函数，进行自定义实现）
      resolveFunc(socket, request);
      //
    });
    // 2.4.监听 error 错误事件
    this.wss.on('error', function error(err) {
      Printer.error(LOGFLAG_WS, 'WebSocket server error:', err);
    });
    // 2.5.监听 close 关闭事件
    this.wss.on('close', function close() {
      Printer.log(LOGFLAG_WS, 'WebSocket server closed');
    });
  }

  /**
   * close 函数
   */
  public close() {
    if (!this.wss) {
      Printer.log(LOGFLAG_WS, 'WebSocket server is not running.');
      return;
    }

    const clients = this.wss?.clients;
    if (clients?.size) {
      clients?.forEach(client => client.close());
    }

    this.wss.close(() => {
      this.wss = null; // 清除引用以防止内存泄漏
      Printer.log(LOGFLAG_WS, 'WebSocket server was closed.');
    });
  }

  /**
   * destory 函数
   */
  public destory() {
    if (!this.wss) {
      Printer.log(LOGFLAG_WS, 'WebSocket server is not running.');
      return;
    }

    const clients = this.wss.clients;
    if (clients?.size) {
      clients?.forEach(client => client.terminate());
    }

    this.wss.close(() => {
      this.wss = null; // 清除引用以防止内存泄漏
      Printer.log(LOGFLAG_WS, 'WebSocket server destoryed.');
    });
  }
}

//
//
// ===== private methods =====
//
//
/**
 * 生成 clientId
 * @returns {string}
 */
function _createClientId() {
  return `${getTimeNowStr()}-${createRandId(3)}`;
}

/**
 * 默认的 resolve 函数
 * @param {WS.WebSocket} socket
 * @param {IncomingMessage} request
 */
function _defaultResolveFunc(socket: WS.WebSocket, request: IncomingMessage) {
  const clientAddr = request.socket.remoteAddress;
  socket.send(`Hi, ${clientAddr}`);
  // open
  socket.on('open', () => {
    Printer.log(LOGFLAG_WS, `Client ${clientAddr} open.`);
  });
  // message
  socket.on('message', (message: any, isBinary: boolean) => {
    Printer.log(LOGFLAG_WS, `Received message => ${message}`, isBinary ? Colors.gray('binary') : '');
    socket.send(`SocketServer: I have recived your message -> ${message}`); // send response
  });
  // upgrade
  socket.on('upgrade', (request: IncomingMessage) => {
    const clientAddr = request.socket.remoteAddress;
    Printer.log(LOGFLAG_WS, `Client ${clientAddr} upgraded.`);
  });
  // ping
  socket.on('ping', (data: Buffer) => {
    Printer.log(LOGFLAG_WS, `Received ping => ${data}`);
    socket.pong(`Pong: ${data?.toString()}`); // pong
  });
  // pong
  socket.on('pong', (data: Buffer) => {
    Printer.log(LOGFLAG_WS, `Received pong => ${data?.toString()}`);
  });
  // error
  socket.on('error', (err: Error) => {
    Printer.error(LOGFLAG_WS, `CLient error: ${err.message}`);
  });
  // unexpected-response
  socket.on('unexpected-response', (request: IncomingMessage, response: IncomingMessage) => {
    Printer.error(LOGFLAG_WS, `CLient unexpected-response: ${response.statusCode} ${response.statusMessage}`);
  });
  // close
  socket.on('close', (code: number, reason: Buffer) => {
    Printer.log(LOGFLAG_WS, `Client close connection.(with code=${code},reason=${reason.toString()})`);
  });
}

/**
 * 删除地址的协议头
 * @param address
 * @returns {string} 删除了协议头（https:// 或 http://）的地址
 */
function _removeProtocol(address: string) {
  return address?.replace(/^(https?:\/\/)/, '').replace(/\/+$/, '') || '';
}
