'use strict';
import http from 'http';
import type { AddressInfo } from 'net';
import WebSocket from 'ws';
import WsCtrl from '../../../src/composites/websocket';
import { Printer } from '../../../src/utils/print';

function listen(server: http.Server): Promise<AddressInfo> {
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => resolve(server.address() as AddressInfo));
  });
}

function closeServer(server: http.Server): Promise<void> {
  if (!server.listening) return Promise.resolve();
  return new Promise((resolve, reject) => server.close(error => (error ? reject(error) : resolve())));
}

function nextMessage(socket: WebSocket): Promise<string> {
  return new Promise((resolve, reject) => {
    socket.once('message', data => resolve(data.toString()));
    socket.once('error', reject);
  });
}

describe('WsCtrl', () => {
  let server: http.Server;
  let ctrl: WsCtrl | null;
  let client: WebSocket | null;

  beforeEach(() => {
    server = http.createServer();
    ctrl = null;
    client = null;
    jest.spyOn(console, 'log').mockImplementation(() => undefined);
    jest.spyOn(Printer, 'log').mockImplementation(() => undefined);
    jest.spyOn(Printer, 'warn').mockImplementation(() => undefined);
    jest.spyOn(Printer, 'error').mockImplementation(() => undefined);
  });

  afterEach(async () => {
    if (client && client.readyState !== WebSocket.CLOSED) {
      client.terminate();
    }
    if (ctrl) {
      await ctrl.destory();
    }
    await closeServer(server);
    jest.restoreAllMocks();
  });

  it('应建立连接并使用默认处理器回复消息', async () => {
    const address = await listen(server);
    ctrl = new WsCtrl({ server, host: address.address, port: address.port, secure: false });
    await ctrl.start();

    client = new WebSocket(`ws://127.0.0.1:${address.port}`);
    const welcomeMessage = nextMessage(client);
    await new Promise<void>((resolve, reject) => {
      client?.once('open', resolve);
      client?.once('error', reject);
    });

    expect(JSON.parse(await welcomeMessage)).toMatchObject({ success: true });

    const responseMessage = nextMessage(client);
    client.send('hello');
    expect(JSON.parse(await responseMessage)).toMatchObject({
      success: true,
      data: expect.stringContaining('hello'),
    });

    await new Promise<void>(resolve => {
      client?.once('close', () => resolve());
      client?.close();
    });
    await ctrl.close();
    ctrl = null;
  });

  it('未启动时关闭应安全返回', async () => {
    const address = await listen(server);
    ctrl = new WsCtrl({ server, host: address.address, port: address.port, secure: false });

    await expect(ctrl.close()).resolves.toBeUndefined();
    expect(Printer.log).toHaveBeenCalledWith(expect.anything(), 'WebSocket server is not running.');
  });
});
