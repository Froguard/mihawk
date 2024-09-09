'use strict';
import type { Server as HttpServer } from 'http';
import type { Server as HttpsServer } from 'https';
import type { Socket } from 'net';

export type EnhancedServer<S extends HttpServer | HttpsServer> = S & {
  destory: (callback?: (...args: any[]) => any) => void;
};

/**
 * 增强版服务实例
 * @param {HttpServer} server
 * @returns {EnhancedServer} sever self
 */
export function enhanceServer<T extends HttpServer | HttpsServer>(server: T) {
  // recored all connection
  const connectMap = new Map<string, Socket>();
  server.on('connection', socket => {
    const { remoteAddress, remotePort } = socket || {};
    const key = `${remoteAddress}:${remotePort}@${Date.now()}`;
    connectMap.set(key, socket);
    //
    socket.on('close', () => {
      connectMap.has(key) && connectMap.delete(key);
    });
  });
  // add a destory method
  (server as EnhancedServer<T>).destory = (callback: (...args: any[]) => any) => {
    // close server
    server.close(() => {
      connectMap.clear();
      typeof callback === 'function' && callback();
    });
    // destroy all connection
    connectMap.forEach(socket => {
      socket.destroy();
    });
  };
  //
  return server as EnhancedServer<T>;
}
