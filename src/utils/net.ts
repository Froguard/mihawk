'use strict';
import net from 'net';
import os from 'os';
import Colors from 'color-cc';

interface PortDetecInfo {
  isInUse?: boolean;
  err?: Error | any;
}

/**
 * 检测端口占用情况
 * @param {number} port
 * @param {boolean} noLogPrint
 * @returns {Promise<{isInUse: boolean, err: any}>}
 */
export async function detectPort(port: number, noLogPrint?: boolean) {
  const result = (await new Promise(res => {
    // 创建服务并监听该端口
    const server = net.createServer().listen(port);
    server.on('listening', function () {
      // 端口未被占用
      server.close(); //关闭服务
      res({ isInUse: false, err: null } as PortDetecInfo);
    });
    server.on('error', (err: { code: string }) => {
      const ERR_CODE = err.code.toUpperCase();
      if (ERR_CODE === 'EADDRINUSE') {
        !noLogPrint && console.error(Colors.yellow(`[ERROR] ${port} 端口占用中！`));
      }
      if (ERR_CODE === 'EACCES') {
        !noLogPrint && console.error(Colors.yellow(`[ERROR] ${port} 端口访问受限制！`));
      }
      res({ isInUse: true, err: err } as PortDetecInfo);
    });
  })) as PortDetecInfo;
  return result;
}

interface IsPortUseOptions {
  timeout?: number; // 超时限制时间 ms
  noLogPrint?: boolean; // 是否禁止控制台输出日志
}
/**
 * 检查端口是否被占用中
 * @param {number} port
 * @param {object} options
 * @returns {boolean} 是否被占用
 */
export async function isPortInUse(port: number, options?: IsPortUseOptions) {
  const { timeout = 1000, noLogPrint = false } = options || {};
  let isInUse = false;
  try {
    const detectd = await Promise.race([
      detectPort(port, !!noLogPrint),
      new Promise(res => setTimeout(() => res({ err: `Timeout with ${timeout}` } as PortDetecInfo), parseInt(timeout as any) || 1000)) as Promise<PortDetecInfo>,
    ]);
    isInUse = !!detectd?.isInUse;
  } catch (error) {
    console.warn(Colors.warn(`Detec isPortInUse(${port}) occur errors:`), error);
    isInUse = false;
  }
  return isInUse;
}

/**
 * 获取本机器的 IP 地址
 * @param {boolean} ipv6 是否为ipv6，不填则默认为 v4
 * @returns {string}
 */
export function getMyIp(ipv6: boolean = false) {
  const LOCAL_HOST = '127.0.0.1';
  const PROTOCOL = ipv6 ? 'ipv6' : 'ipv4';
  const interfaces = os.networkInterfaces();
  for (const infoList of Object.values(interfaces)) {
    for (const info of infoList) {
      const {
        address, // '127.0.0.1',
        // netmask, // '255.0.0.0',
        family, // 'IPv4' | 'IPv6',
        // mac, // '00:00:00:00:00:00',
        internal, // true,
        // cidr, // '127.0.0.1/8'
      } = info || {};
      // 非 127.0.0.1 && 非 internal && 协议满足目标要求
      if (address !== LOCAL_HOST && !internal && family.toLowerCase() === PROTOCOL) {
        return address;
      }
    }
  }
  return LOCAL_HOST;
}
