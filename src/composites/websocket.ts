'use strict';
import http from 'http';
import https from 'https';
import { parseStompMsg } from '../utils/parser';

/**
 * 构造器传参
 */
export interface WebSocketServerOptions {
  /**
   * 端口号，默认为 3000
   */
  port?: number;
  /**
   * 消息体数据，是否使用 stomp 协议，默认为 false
   */
  stomp?: boolean;
  /**
   * httpServer 实例（如果同时配置了 httpServer 和 httpsServer，则优先使用 httpsServer）
   */
  httpServer?: http.Server;
  /**
   * httpsServer 实例（如果同时配置了 httpServer 和 httpsServer，则优先使用 httpsServer）
   */
  httpsServer?: https.Server;
}

/**
 * websocket 服务端相关操作的二次封装，class 类
 * // TODO: 基于开源工具包 ws 进行封装，完成 stomp 协议解析
 */
export default class WebSocketServer {
  private port: number;
  private useStompMsg: boolean;
  private httpOrHttpsServer: http.Server | https.Server; // httpServer 或 httpsServer 实例

  /**
   * 构造器
   */
  constructor(private options: WebSocketServerOptions) {
    const {
      port = 3000,
      stomp = false, //
      httpServer = null,
      httpsServer = null,
    } = options;
    // port
    this.port = port;
    // useStompMsg
    this.useStompMsg = !!stomp;
    // httpOrHttpsServer
    if (httpsServer) {
      this.httpOrHttpsServer = httpsServer;
    } else if (httpServer) {
      this.httpOrHttpsServer = httpServer;
    } else {
      throw new Error('WebSocketServer: httpServer or httpsServer must be provided');
    }
  }

  /**
   * start 函数
   */
  start() {
    // TODO: 待实现
  }

  /**
   * close 函数
   */
  close() {
    // TODO: 待实现
  }

  /**
   * destory 函数
   */
  destory() {
    // TODO: 待实现
  }
}
