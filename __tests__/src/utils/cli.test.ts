'use strict';
import { getCliArgs } from '../../../src/utils/cli';

jest.mock('prompts', () => jest.fn());

describe('getCliArgs', () => {
  it('应解析参数为对象', () => {
    const args = getCliArgs(['node', 'script.js', '--port', '8080', '--watch']);
    expect(args.port).toBe(8080);
    expect(args.watch).toBe(true);
  });

  it('应解析缩写参数', () => {
    const args = getCliArgs(['node', 'script.js', '-p', '3000', '-v']);
    expect(args.p).toBe(3000);
    expect(args.v).toBe(true);
  });

  it('应将非参数放入 _ 数组', () => {
    const args = getCliArgs(['node', 'script.js', 'start', '--env', 'dev']);
    expect(args._).toEqual(['start']);
    expect(args.env).toBe('dev');
  });

  it('空数组应返回空对象', () => {
    const args = getCliArgs([]);
    expect(args).toEqual({ _: [] });
  });

  it('应解析布尔型参数', () => {
    const args = getCliArgs(['node', 'script.js', '--https']);
    expect(args.https).toBe(true);
  });

  it('应解析 key=value 参数', () => {
    const args = getCliArgs(['node', 'script.js', '--port=8080']);
    expect(args.port).toBe(8080);
  });
});
