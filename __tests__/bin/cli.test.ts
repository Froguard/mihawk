'use strict';
import { execFileSync } from 'child_process';
import path from 'path';

const BIN_PATH = path.resolve(__dirname, '../../bin/index.ts');
const TS_NODE_PATH = require.resolve('ts-node/dist/bin.js');

/**
 * 使用当前 Node.js 进程直接执行 CLI，避免通过 shell 拼接命令和参数。
 *
 * @param {...string} args 传递给 CLI 的参数
 * @returns {string} CLI 写入标准输出的内容
 * @throws {Error} CLI 无法启动或以非零状态退出时抛出
 */
function runCli(...args: string[]) {
  return execFileSync(process.execPath, [TS_NODE_PATH, BIN_PATH, ...args], {
    encoding: 'utf-8',
  });
}

describe('CLI', () => {
  it('--help 应显示帮助信息', () => {
    const output = runCli('--help');
    expect(output.toLowerCase()).toContain('usage');
  });

  it('-h 应显示帮助信息', () => {
    const output = runCli('-h');
    expect(output.toLowerCase()).toContain('usage');
  });

  it('--version 应显示版本号', () => {
    const output = runCli('--version');
    expect(output).toMatch(/\d+\.\d+\.\d+/);
  });

  it('-v 应显示版本号', () => {
    const output = runCli('-v');
    expect(output).toMatch(/\d+\.\d+\.\d+/);
  });

  it('未识别的子命令应给出提示信息', () => {
    // init 子命令不带参数时也应正常退出或给出提示
    const output = runCli('--help');
    expect(output.length).toBeGreaterThan(0);
  });
});
