'use strict';
import { processExit } from '../../../src/utils/process';

describe('processExit', () => {
  let exitSpy: jest.SpyInstance;
  let logSpy: jest.SpyInstance;
  let consoleLogSpy: jest.SpyInstance;

  beforeEach(() => {
    exitSpy = jest.spyOn(process, 'exit').mockImplementation((() => undefined) as () => never);
    logSpy = jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    exitSpy.mockRestore();
    logSpy.mockRestore();
    consoleLogSpy?.mockRestore();
  });

  it('应调用 process.exit 并传入默认 code 1', () => {
    processExit();
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('应调用 process.exit 并传入指定 code', () => {
    processExit(0);
    expect(exitSpy).toHaveBeenCalledWith(0);
  });

  it('应在退出前执行 beforeQuit 回调', () => {
    const beforeQuit = jest.fn();
    processExit(1, beforeQuit);
    expect(beforeQuit).toHaveBeenCalledTimes(1);
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('beforeQuit 非函数时不应报错', () => {
    expect(() => processExit(1, undefined)).not.toThrow();
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});
