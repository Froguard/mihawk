'use strict';
import path from 'path';
import * as fs from 'fs-extra';
import { findJsonFiles, scanExistedRoutes } from '../../../src/composites/scanner';
import { Printer } from '../../../src/utils/print';

const TEST_DIR = path.resolve(__dirname, '../../../__tests__tmp__/scanner-test');

describe('scanner', () => {
  beforeEach(() => {
    fs.emptyDirSync(TEST_DIR);
    fs.ensureDirSync(path.join(TEST_DIR, 'GET/nested'));
    fs.writeJsonSync(path.join(TEST_DIR, 'GET/index.json'), { ok: true });
    fs.writeFileSync(path.join(TEST_DIR, 'GET/nested/user.json5'), '{ ok: true }');
    fs.writeFileSync(path.join(TEST_DIR, 'GET/ignored.txt'), 'ignored');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  afterAll(() => {
    fs.removeSync(TEST_DIR);
  });

  it('应递归查找指定后缀文件并返回相对路径', () => {
    expect(findJsonFiles(TEST_DIR)).toEqual([path.join('GET', 'index.json')]);
    expect(findJsonFiles(TEST_DIR, 'json5')).toEqual([path.join('GET', 'nested', 'user.json5')]);
  });

  it('目录不存在时应返回空数组并打印警告', () => {
    const warn = jest.spyOn(Printer, 'warn').mockImplementation(() => undefined);

    expect(findJsonFiles(path.join(TEST_DIR, 'missing'))).toEqual([]);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('not existed'));
  });

  it('应将扫描结果转换为路由信息', () => {
    expect(scanExistedRoutes(TEST_DIR)).toEqual([{ method: 'GET', path: '/index' }]);
  });
});
