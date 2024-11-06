'use strict';
import { ClientRequest, IncomingMessage } from 'http';
import * as WS from 'ws';
import { parseStompMsg } from '../utils/parser';

/**
 * 构造器传参
 */
export interface WsExOptions {
  /**
   * ws 配置
   */
  ws?: WS.ServerOptions;

  /**
   * 消息体数据，是否使用 stomp 协议，默认为 false
   */
  stomp?: boolean;

  /**
   * socket 监听器
   */
  socketListerner?: {
    open?: () => void;
    close?: (code?: number) => void;
    message?: (data: WS.RawData, isBinary: boolean) => void;
    ipgrade?: (request: IncomingMessage) => void;
    ping?: (data: WS.RawData) => void;
    pong?: (data: WS.RawData) => void;
    error?: (error: Error) => void;
    unexpectedResponse?: (request: ClientRequest, response: IncomingMessage) => void;
  };
}

/**
 * websocket 服务端相关操作的二次封装，class 类
 * // TODO: 基于开源工具包 ws 进行封装，完成 stomp 协议解析
 */
export default class WebSocketEx {
  private useStompMsg: boolean;
  private wss?: WS.WebSocketServer | null; // 是一个 web socket sever 实例
  private wsOptions: WS.ServerOptions;
  /**
   * 构造器
   */
  constructor(options: WsExOptions) {
    const { stomp = false, ws } = options;
    // useStompMsg
    this.useStompMsg = !!stomp;
    // ws options
    this.wsOptions = ws || {};
    // wss
    this.wss = null;
  }

  /**
   * start 函数
   */
  public start() {
    if (this.wss) {
      console.log('WS server is already running.');
      return;
    }
    /**
     * 疑惑点：wss 和 ws 啥区别？
     * - wss 是一个 web socket sever 实例
     * - ws 则是 web scoket 实例，为了便于理解，同时见啥误操作，命名上，不使用 ws，而直接用 socket 命名
     */
    this.wss = new WS.WebSocketServer(this.wsOptions);

    this.wss.on('connection', (socket: WS.WebSocket) => {
      console.log('Client connected.');

      socket.on('message', (message: string) => {
        console.log(`Received message => ${message}`);
        socket.send(`Hello, you sent -> ${message}`);
      });

      socket.on('close', () => {
        console.log('Client disconnected.');
      });
    });

    console.log('WS server started on port 8080.');
  }

  /**
   * close 函数
   */
  public close() {
    if (!this.wss) {
      console.log('WebSocket server is not running.');
      return;
    }

    const clients = this.wss.clients;
    if (clients?.size) {
      clients?.forEach(client => client.close());
    }

    this.wss.close(() => {
      this.wss = null; // 清除引用以防止内存泄漏
      console.log('WebSocket server stopped.');
    });
  }

  /**
   * destory 函数
   */
  public destory() {
    if (!this.wss) {
      console.log('WebSocket server is not running.');
      return;
    }

    const clients = this.wss.clients;
    if (clients?.size) {
      clients?.forEach(client => client.terminate());
    }

    this.wss.close(() => {
      this.wss = null; // 清除引用以防止内存泄漏
      console.log('WebSocket server destoryed.');
    });
  }
}
