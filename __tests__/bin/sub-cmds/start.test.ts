'use strict';
import path from 'path';
import start from '../../../bin/sub-cmds/start';
import mihawk from '../../../src/index';
import { getRcData } from '../../../src/composites/rc';
import { createWatcher } from '../../../src/composites/watcher';
import { processExit } from '../../../src/utils/process';
import { sleep, throttleAsync } from '../../../src/utils/async';
import { Printer } from '../../../src/utils/print';

jest.mock('../../../src/index', () => ({ __esModule: true, default: jest.fn() }));
jest.mock('../../../src/composites/rc', () => ({ getRcData: jest.fn() }));
jest.mock('../../../src/composites/watcher', () => ({ createWatcher: jest.fn() }));
jest.mock('../../../src/utils/process', () => ({ processExit: jest.fn() }));
jest.mock('../../../src/utils/async', () => ({
  sleep: jest.fn(),
  throttleAsync: jest.fn((callback: (...args: any[]) => any) => callback),
}));

describe('start 子命令', () => {
  const serverHandle = {
    close: jest.fn(),
    destroy: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => undefined);
    jest.spyOn(Printer, 'log').mockImplementation(() => undefined);
    jest.spyOn(Printer, 'warn').mockImplementation(() => undefined);
    jest.spyOn(Printer, 'error').mockImplementation(() => undefined);
    (mihawk as jest.Mock).mockResolvedValue(serverHandle);
    (getRcData as jest.Mock).mockResolvedValue({ port: 8000, watch: false });
    (sleep as jest.Mock).mockResolvedValue(undefined);
    serverHandle.close.mockResolvedValue(undefined);
    serverHandle.destroy.mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('应合并 RC 与 CLI 参数并启动 mihawk', async () => {
    const onBodyParserError = jest.fn();
    const rootConfig = { port: 8000, watch: false, bodyParser: { jsonLimit: '2mb', formLimit: '128kb' }, onBodyParserError };
    const args = { _: [] as string[], port: 9000, mockDir: './api-mocks', watch: false, bodyParser: { jsonLimit: '3mb' } };
    (getRcData as jest.Mock).mockResolvedValue(rootConfig);

    await start(args);

    expect(getRcData).toHaveBeenCalledWith('.mihawkrc', { initConfig: expect.objectContaining({ port: 8888 }) });
    expect(mihawk).toHaveBeenCalledWith(expect.objectContaining({ port: 9000, mockDir: './api-mocks', watch: false }), undefined);
    const finalConfig = (mihawk as jest.Mock).mock.calls[0][0];
    expect(finalConfig.bodyParser).toEqual({ jsonLimit: '3mb', formLimit: '128kb' });
    expect(finalConfig.onBodyParserError).toBe(onBodyParserError);
    expect(rootConfig.bodyParser).toEqual({ jsonLimit: '2mb', formLimit: '128kb' });
    expect(args.bodyParser).toEqual({ jsonLimit: '3mb' });
    expect(createWatcher).not.toHaveBeenCalled();
  });

  it('watch 开启时应监听逻辑文件并重启服务', async () => {
    jest.useFakeTimers();
    const onBodyParserError = jest.fn();
    const bodyParser = { jsonLimit: '2mb', formLimit: '128kb' };
    (getRcData as jest.Mock).mockResolvedValue({ watch: true, mockDir: './mocks', mockLogicFileType: 'ts', bodyParser, onBodyParserError });
    let watcherCallback: ((eventName: string, ...args: any[]) => void) | undefined;
    (createWatcher as jest.Mock).mockImplementation((_config, callback) => {
      watcherCallback = callback;
      return { close: jest.fn() };
    });

    await start({ _: [] });
    jest.runOnlyPendingTimers();

    expect(throttleAsync).toHaveBeenCalledWith(expect.any(Function), 500);
    expect(createWatcher).toHaveBeenCalledWith(expect.objectContaining({ watch: true }), expect.any(Function));

    watcherCallback?.('change', path.resolve('mocks/data/GET/user.ts'));
    await Promise.resolve();
    await Promise.resolve();

    expect(serverHandle.close).toHaveBeenCalledTimes(1);
    expect(sleep).toHaveBeenCalledWith(0);
    expect(mihawk).toHaveBeenLastCalledWith(expect.objectContaining({ watch: true }), true);
    expect(mihawk).toHaveBeenCalledTimes(2);
    for (const [config] of (mihawk as jest.Mock).mock.calls) {
      expect(config.bodyParser).toEqual(bodyParser);
      expect(config.onBodyParserError).toBe(onBodyParserError);
    }
  });

  it('启动失败时应记录错误并退出', async () => {
    (mihawk as jest.Mock).mockRejectedValue(new Error('start failed'));

    await start({ _: [], watch: false });

    expect(Printer.error).toHaveBeenCalledWith(expect.stringContaining('mihawk(config)'), expect.any(Error));
    expect(processExit).toHaveBeenCalledWith(1);
  });
});
