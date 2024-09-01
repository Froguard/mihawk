import type { Server as HttpServer } from 'http';
import type { Socket } from 'net';

export interface EnhancedHttpServer extends HttpServer {
  destory: (callback: (...args: any[]) => any) => void;
}

/**
 * 增强版服务实例
 * @param {HttpServer} server
 * @returns {EnhancedHttpServer} sever self
 */
export function enhanceServer(server: HttpServer) {
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
  (server as EnhancedHttpServer).destory = (callback: (...args: any[]) => any) => {
    // close server
    server.close(() => {
      connectMap.clear();
      callback();
    });
    // destroy all connection
    connectMap.forEach(socket => {
      socket.destroy();
    });
  };
  //
  return server as EnhancedHttpServer;
}
