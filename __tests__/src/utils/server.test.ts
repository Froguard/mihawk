'use strict';
import * as http from 'http';
import { enhanceServer, isServerAddressInfo, getAddrInfoByServer, getPortByServer, getAddressByServer } from '../../../src/utils/server';

describe('server utils', () => {
  let server: http.Server;
  let enhanced: any;

  afterEach(async () => {
    if (server?.listening) {
      if (enhanced?.destroy) {
        await enhanced.destroy();
      } else {
        server.close();
      }
    }
    server = null as any;
    enhanced = null;
  });

  describe('enhanceServer', () => {
    it('应为 server 添加 destroy 方法', () => {
      server = http.createServer();
      enhanced = enhanceServer(server);
      expect(typeof enhanced.destroy).toBe('function');
    });

    it('destroy 应关闭服务器', async () => {
      server = http.createServer();
      enhanced = enhanceServer(server);
      await new Promise<void>(res => server.listen(0, res));
      expect(server.listening).toBe(true);
      await enhanced.destroy();
      expect(server.listening).toBe(false);
    });

    it('destroy 应执行回调', async () => {
      server = http.createServer();
      enhanced = enhanceServer(server);
      await new Promise<void>(res => server.listen(0, res));
      const callback = jest.fn();
      await enhanced.destroy(callback);
      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  describe('isServerAddressInfo', () => {
    it('应判定 AddressInfo 对象', () => {
      expect(isServerAddressInfo({ address: '0.0.0.0', family: 'IPv4', port: 8080 })).toBe(true);
    });

    it('字符串地址应返回 false', () => {
      expect(isServerAddressInfo('/tmp/socket')).toBe(false);
    });

    it('null 应返回 false', () => {
      expect(isServerAddressInfo(null)).toBe(false);
    });

    it('undefined 应返回 false', () => {
      expect(isServerAddressInfo(undefined)).toBe(false);
    });
  });

  describe('getAddrInfoByServer', () => {
    it('应返回 AddressInfo', async () => {
      server = http.createServer();
      await new Promise<void>(res => server.listen(0, res));
      const info = getAddrInfoByServer(server);
      expect(info).not.toBeNull();
      expect(info?.port).toBeGreaterThan(0);
    });

    it('未监听的服务器应返回 null', () => {
      server = http.createServer();
      expect(getAddrInfoByServer(server)).toBeNull();
    });
  });

  describe('getPortByServer', () => {
    it('应返回监听的端口', async () => {
      server = http.createServer();
      await new Promise<void>(res => server.listen(0, res));
      const port = getPortByServer(server);
      expect(typeof port).toBe('number');
      expect(port).toBeGreaterThan(0);
    });

    it('未监听的服务器应返回 null', () => {
      server = http.createServer();
      expect(getPortByServer(server)).toBeNull();
    });
  });

  describe('getAddressByServer', () => {
    it('应返回地址字符串', async () => {
      server = http.createServer();
      await new Promise<void>(res => server.listen(0, '127.0.0.1', res));
      const addr = getAddressByServer(server);
      expect(addr).toBe('127.0.0.1');
    });

    it('未监听的服务器应返回 null', () => {
      server = http.createServer();
      expect(getAddressByServer(server)).toBeNull();
    });
  });
});
