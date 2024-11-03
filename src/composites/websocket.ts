'use strict';
import WebSocket, { WebSocketServer, ServerOptions } from 'ws';
import { parseStompMsg } from '../utils/parser';
import type { EnhancedServer, HttpOrHttpsServer } from '../utils/server';

type EnhancedHttpOrHttpsServer = EnhancedServer<HttpOrHttpsServer>;

/**
 * 构造器传参
 */
export interface WebSocketServerOptions extends ServerOptions {
  /**
   * 消息体数据，是否使用 stomp 协议，默认为 false
   */
  stomp?: boolean;
}

/**
 * websocket 服务端相关操作的二次封装，class 类
 * // TODO: 基于开源工具包 ws 进行封装，完成 stomp 协议解析
 */
export default class WebSocketEx {
  private useStompMsg: boolean;
  private httpOrHttpsServer?: EnhancedHttpOrHttpsServer; // 增强版的 httpServer 或 httpsServer 实例
  private wss: WebSocketServer;

  /**
   * 构造器
   */
  constructor(private options: WebSocketServerOptions) {
    const {
      server = null,
      stomp = false, //
    } = options;
    // useStompMsg
    this.useStompMsg = !!stomp;
    // httpOrHttpsServer
    if (server) {
      this.httpOrHttpsServer = server as EnhancedHttpOrHttpsServer;
    } else {
      throw new Error('WebSocketServer: httpServer or httpsServer instance must be provided as `server` param in options!');
    }
  }

  /**
   * start 函数
   */
  public start() {
    // TODO: 待实现
  }

  /**
   * close 函数
   */
  public close() {
    // TODO: 待实现
  }

  /**
   * destory 函数
   */
  public destory() {
    // TODO: 待实现
  }
}
