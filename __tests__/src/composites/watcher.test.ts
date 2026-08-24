'use strict';
import path from 'path';
import * as chokidar from 'chokidar';
import { createWatcher, refreshModule } from '../../../src/composites/watcher';
import { refreshJson, refreshMockModuleGraph } from '../../../src/composites/loader';
import { Printer } from '../../../src/utils/print';

jest.mock('chokidar', () => ({ watch: jest.fn() }));
jest.mock('../../../src/composites/loader', () => ({
  refreshJson: jest.fn(),
  refreshMockModuleGraph: jest.fn(),
}));

describe('watcher', () => {
  let handlers: Record<string, (...args: any[]) => any>;
  let fakeWatcher: { on: jest.Mock };

  beforeEach(() => {
    handlers = {};
    fakeWatcher = {
      on: jest.fn((eventName: string, handler: (...args: any[]) => any) => {
        handlers[eventName] = handler;
        return fakeWatcher;
      }),
    };
    (chokidar.watch as jest.Mock).mockReturnValue(fakeWatcher);
    jest.spyOn(console, 'log').mockImplementation(() => undefined);
    jest.spyOn(Printer, 'log').mockImplementation(() => undefined);
    jest.spyOn(Printer, 'error').mockImplementation(() => undefined);
  });

  afterEach(async () => {
    await new Promise<void>(resolve => process.nextTick(resolve));
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  it('refreshModule 应按文件类型刷新对应缓存', () => {
    const mockDir = path.resolve('mocks');
    const tsPath = path.resolve('mocks/data/GET/user.ts');
    const jsonPath = path.resolve('mocks/data/GET/user.json');

    refreshModule(tsPath, 'ts', mockDir);
    refreshModule(jsonPath, 'ts', mockDir);
    refreshModule(path.resolve('mocks/readme.txt'), 'ts', mockDir);

    expect(refreshMockModuleGraph).toHaveBeenCalledWith(tsPath, { mockDir });
    expect(refreshJson).toHaveBeenCalledWith(jsonPath);
    expect(refreshMockModuleGraph).toHaveBeenCalledTimes(1);
    expect(refreshJson).toHaveBeenCalledTimes(1);
  });

  it('createWatcher 应配置忽略规则并处理 change 事件', () => {
    const callback = jest.fn();
    const filePath = path.resolve('mocks/data/GET/user.ts');

    const watcher = createWatcher({ mockDir: './mocks', mockLogicFileType: 'ts' }, callback);
    handlers.all('change', filePath);

    expect(watcher).toBe(fakeWatcher);
    expect(chokidar.watch).toHaveBeenCalledWith(path.resolve('./mocks'), expect.objectContaining({ persistent: true, ignoreInitial: true, ignored: expect.any(Array) }));
    expect(refreshMockModuleGraph).toHaveBeenCalledWith(filePath, { mockDir: path.resolve('./mocks') });
    expect(callback).toHaveBeenCalledWith('change', filePath);
  });

  it('createWatcher 应处理 rename 并刷新新旧文件', () => {
    const callback = jest.fn();
    const oldPath = path.resolve('mocks/data/GET/old.json');
    const newPath = path.resolve('mocks/data/GET/new.json');

    createWatcher({ mockDir: './mocks', mockLogicFileType: 'none' }, callback);
    handlers.rename(oldPath, newPath);

    expect(refreshJson).toHaveBeenNthCalledWith(1, oldPath);
    expect(refreshJson).toHaveBeenNthCalledWith(2, newPath);
    expect(callback).toHaveBeenCalledWith('rename', oldPath, newPath);
  });
});
