'use strict';
import { promisify } from 'util';
import type { Server as HttpServer } from 'http';
import type { Server as HttpsServer } from 'https';
import type { Socket, AddressInfo } from 'net';

/**
 * http/https 服务实例
 */
export type HttpOrHttpsServer = HttpServer | HttpsServer;

/**
 * 增强版服务实例
 */
export type EnhancedServer<S extends HttpOrHttpsServer = HttpOrHttpsServer> = S & {
  destory: (callback?: (...args: any[]) => any) => Promise<void>;
};

/**
 * 增强版服务实例
 * @param {HttpOrHttpsServer} server
 * @returns {EnhancedServer} sever self
 */
export function enhanceServer<T extends HttpOrHttpsServer>(server: T) {
  // connection-recorder
  let connectMap: Map<string, Socket> | null = null;
  /**
   * recored all connections
   */
  server.on('connection', socket => {
    if (!connectMap) {
      connectMap = new Map<string, Socket>(); // lazy init
    }
    const { remoteAddress, remotePort } = socket || {};
    const key = `${remoteAddress}:${remotePort}@${Date.now()}`;
    connectMap?.set(key, socket);
    //
    socket.on('close', () => {
      connectMap?.has(key) && connectMap.delete(key);
    });
  });
  /**
   * add a destory method
   */
  (server as EnhancedServer<T>).destory = async (callback: (...args: any[]) => any) => {
    // 0.close all connections
    server.closeAllConnections();
    server.closeIdleConnections();
    // 1.close server
    const closeServer = promisify(server.close).bind(server);
    await closeServer();
    // 2.destroy & clear all connected socket
    if (connectMap) {
      for (const [key, socket] of connectMap.entries()) {
        // await new Promise((res, rej) => {
        //   socket.on('close', err => (err ? rej(err) : res(true)));
        //   socket.destroy();
        // }).catch(err => console.error(`Failed to close & destroy socket(${key}):\n`, err));
        socket.destroy();
      }
      connectMap.clear();
      connectMap = null;
    }
    // 3.invoke callback
    typeof callback === 'function' && callback();
  };
  //
  return server as EnhancedServer<T>;
}

/**
 * 判断地址信息是否为 AddressInfo 对象
 * @param {any} obj
 * @returns {boolean}
 */
export function isServerAddressInfo(obj: unknown): obj is AddressInfo {
  if (typeof obj === 'object' && obj !== null && obj !== undefined) {
    return 'address' in obj;
  }
  return false;
}

/**
 * 获取 server 的地址相关信息
 * @param {HttpOrHttpsServer} server
 * @return {AddressInfo|null} obj|null
 */
export function getAddrInfoByServer(server: HttpOrHttpsServer) {
  const addr = server.address();
  // console.log('addrinfo:', addr);
  if (isServerAddressInfo(addr)) {
    return addr;
  }
  return null;
}

/**
 * 获取服务的端口信息
 * @param {HttpOrHttpsServer} server
 * @returns {number|null} 端口
 */
export function getPortByServer(server: HttpOrHttpsServer) {
  /**
   * - 当 server 绑定的是 地址+端口 时，返回的是 AddressInfo 对象
   * - 当 server 绑定的是 unix 套接字时，返回的是 string 路径字符串
   * - 当 server 绑定不成功时，返回的是 null
   */
  return getAddrInfoByServer(server)?.port || null;
}

/**
 * 获取 server 的地址字符串
 * @param {HttpOrHttpsServer} server
 * @returns {string|null}
 */
export function getAddressByServer(server: HttpOrHttpsServer) {
  return getAddrInfoByServer(server)?.address || null;
}
