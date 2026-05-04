'use strict';
import { Printer } from '../../../src/utils/print';

describe('Printer', () => {
  let logSpy: jest.SpyInstance;
  let warnSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    logSpy = jest.spyOn(console, 'log').mockImplementation();
    warnSpy = jest.spyOn(console, 'warn').mockImplementation();
    errorSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    logSpy.mockRestore();
    warnSpy.mockRestore();
    errorSpy.mockRestore();
  });

  describe('log', () => {
    it('应打印参数', () => {
      Printer.log('hello', 'world');
      expect(logSpy).toHaveBeenCalledTimes(1);
      expect(logSpy.mock.calls[0][0]).toContain('[mihawk]');
      expect(logSpy.mock.calls[0]).toContain('hello');
      expect(logSpy.mock.calls[0]).toContain('world');
    });

    it('无参数时应只打印换行', () => {
      Printer.log();
      expect(logSpy).toHaveBeenCalledTimes(1);
      expect(logSpy).toHaveBeenCalledWith();
    });
  });

  describe('warn', () => {
    it('应打印警告参数', () => {
      Printer.warn('warning', 'message');
      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(warnSpy.mock.calls[0][0]).toContain('[mihawk]');
      expect(warnSpy.mock.calls[0]).toContain('warning');
      expect(warnSpy.mock.calls[0]).toContain('message');
    });

    it('无参数时应只打印换行', () => {
      Printer.warn();
      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(warnSpy).toHaveBeenCalledWith();
    });
  });

  describe('error', () => {
    it('应打印错误参数', () => {
      Printer.error('error', 'message');
      expect(errorSpy).toHaveBeenCalledTimes(1);
      expect(errorSpy.mock.calls[0][0]).toContain('[mihawk]');
      expect(errorSpy.mock.calls[0]).toContain('error');
      expect(errorSpy.mock.calls[0]).toContain('message');
    });

    it('无参数时应只打印换行', () => {
      Printer.error();
      expect(errorSpy).toHaveBeenCalledTimes(1);
      expect(errorSpy).toHaveBeenCalledWith();
    });
  });
});
