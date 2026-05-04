'use strict';
import net from 'net';
import { isPortInUse, isLocalHost, supportLocalHost, getMyIp } from '../../../src/utils/net';

describe('isLocalHost', () => {
  it('localhost 应返回 true', () => {
    expect(isLocalHost('localhost')).toBe(true);
    expect(isLocalHost('127.0.0.1')).toBe(true);
    expect(isLocalHost('::1')).toBe(true);
  });
  it('非 localhost 应返回 false', () => {
    expect(isLocalHost('0.0.0.0')).toBe(false);
    expect(isLocalHost('192.168.1.1')).toBe(false);
    expect(isLocalHost('example.com')).toBe(false);
  });
});

describe('supportLocalHost', () => {
  it('localhost 相关应返回 true', () => {
    expect(supportLocalHost('localhost')).toBe(true);
    expect(supportLocalHost('127.0.0.1')).toBe(true);
    expect(supportLocalHost('0.0.0.0')).toBe(true);
  });
  it('非本地地址应返回 false', () => {
    expect(supportLocalHost('192.168.1.1')).toBe(false);
    expect(supportLocalHost('example.com')).toBe(false);
  });
});

describe('getMyIp', () => {
  it('应返回一个字符串 IP 地址', () => {
    const ip = getMyIp();
    expect(typeof ip).toBe('string');
    expect(ip.length).toBeGreaterThan(0);
  });
  it('IPv6 模式应返回字符串', () => {
    const ip = getMyIp(true);
    expect(typeof ip).toBe('string');
  });
});

describe('isPortInUse', () => {
  it('已占用的端口应返回 true', async () => {
    const server = net.createServer().listen(0);
    const port = (server.address() as net.AddressInfo).port;

    const result = await isPortInUse(port, { noLogPrint: true });
    expect(result).toBe(true);

    server.close();
  });
  it('未占用的端口应返回 false', async () => {
    const result = await isPortInUse(54321, { noLogPrint: true, timeout: 500 });
    expect(result).toBe(false);
  });
});
