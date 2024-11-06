'use strict';
import { ClientRequest, IncomingMessage } from 'http';
import Colors from 'color-cc';
import * as WS from 'ws';
import { parseStompMsg } from '../utils/parser';
import { Debugger, Printer } from '../utils/print';
import { createRandId } from '../utils/str';
import { getTimeNowStr } from '../utils/date';
import { PKG_NAME } from '../consts';

// 生成 clientId
function createClientId() {
  return `${getTimeNowStr()}-${createRandId()}`;
}

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
 * 构造器传参
 */
export interface WsExOptions {
  /**
   * ws 配置
   */
  wssOptions?: WS.ServerOptions;

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
  resolve?: (socket: WS.WebSocket, request: IncomingMessage) => void;
}

/**
 * websocket 服务端相关操作的二次封装，class 类
 */
export default class WsCtrl {
  private useStompMsg: boolean;
  private port: number;
  private wss?: WS.WebSocketServer | null; // 是一个 web socket sever 实例
  private wssOptions: WS.ServerOptions;
  /**
   * 构造器
   */
  constructor(options: WsExOptions) {
    const { stomp = false, wssOptions } = options;
    // useStompMsg
    this.useStompMsg = !!stomp;
    // ws options
    this.wssOptions = wssOptions || {};
    // TODO: 获取到 httpServer/httpsServer 实例上的 port 信息
    // wss
    this.wss = null;
  }

  /**
   * start 函数
   */
  public start() {
    if (this.wss) {
      Printer.log(LOGFLAG_WS, 'WS server is already running.');
      return;
    }
    // 1. 创建对应的 WebsocketServer 实例
    this.wss = new WS.WebSocketServer(this.wssOptions);

    // 2. 注册 wss 上的基础事件 (listerning,headers,connection,error,close)

    // 监听 WebSocket 服务器开始监听连接
    this.wss.on('listening', function listening() {
      Printer.log(LOGFLAG_WS, 'WebSocket server is listening');
    });

    // 监听 headers 事件
    this.wss.on('headers', function headers(headers, req) {
      Debugger.log('Headers:', headers);
      // 添加或修改响应头
      headers.push(`X-Powered-By: ${PKG_NAME}`);
    });

    // 监听 connection 事件：当有新的客户端连接时的处理
    this.wss.on('connection', (socket: WS.WebSocket, request: IncomingMessage) => {
      const { remoteAddress, remotePort } = request?.socket || {};
      const clientId = remoteAddress ? `${remoteAddress}:${remotePort}_${getTimeNowStr()}` : createClientId();
      Printer.log(LOGFLAG_WS, 'Socket client connected!', Colors.gray(`clientId: ${clientId}`));
      /*
      // socket 实例上的一系列事件
      //
      socket.on('message', (message: string) => {
        Printer.log(LOGFLAG_WS, `Received message => ${message}`);
        socket.send(`Hello, you sent -> ${message}`);
      });
      //
      socket.on('close', () => {
        Printer.log(LOGFLAG_WS, 'Client disconnected.');
      });
      */
    });

    // 监听 error 错误事件
    this.wss.on('error', function error(err) {
      Printer.error(LOGFLAG_WS, 'WebSocket server error:', err);
    });

    // 监听 close 关闭事件
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
