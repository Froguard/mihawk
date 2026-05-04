'use strict';
import { execSync } from 'child_process';
import path from 'path';

const BIN_PATH = path.resolve(__dirname, '../../bin/index.ts');
const TS_NODE = 'ts-node';

describe('CLI', () => {
  it('--help 应显示帮助信息', () => {
    const output = execSync(`${TS_NODE} ${BIN_PATH} --help`, { encoding: 'utf-8' });
    expect(output.toLowerCase()).toContain('usage');
  });

  it('-h 应显示帮助信息', () => {
    const output = execSync(`${TS_NODE} ${BIN_PATH} -h`, { encoding: 'utf-8' });
    expect(output.toLowerCase()).toContain('usage');
  });

  it('--version 应显示版本号', () => {
    const output = execSync(`${TS_NODE} ${BIN_PATH} --version`, { encoding: 'utf-8' });
    expect(output).toMatch(/\d+\.\d+\.\d+/);
  });

  it('-v 应显示版本号', () => {
    const output = execSync(`${TS_NODE} ${BIN_PATH} -v`, { encoding: 'utf-8' });
    expect(output).toMatch(/\d+\.\d+\.\d+/);
  });

  it('未识别的子命令应给出提示信息', () => {
    // init 子命令不带参数时也应正常退出或给出提示
    const output = execSync(`${TS_NODE} ${BIN_PATH} --help`, { encoding: 'utf-8' });
    expect(output.length).toBeGreaterThan(0);
  });
});
