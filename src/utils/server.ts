'use strict';
import { promisify } from 'util';
import type { Server as HttpServer } from 'http';
import type { Server as HttpsServer } from 'https';
import type { Socket } from 'net';

export type EnhancedServer<S extends HttpServer | HttpsServer> = S & {
  destory: (callback?: (...args: any[]) => any) => Promise<void>;
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
  (server as EnhancedServer<T>).destory = async (callback: (...args: any[]) => any) => {
    const closeServer = promisify(server.close).bind(server);
    // 1.close server
    await closeServer();
    // 2.destroy & clear all connection
    for (const [key, socket] of connectMap.entries()) {
      await new Promise(resolve => {
        socket.on('close', resolve);
        socket.destroy();
      }).catch(err => console.error(`Failed to destroy socket(${key}):\n`, err));
    }
    connectMap.clear();
    // 3.invoke callback
    typeof callback === 'function' && callback();
  };
  //
  return server as EnhancedServer<T>;
}
