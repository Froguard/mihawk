'use strict';
import path from 'path';
import * as fs from 'fs-extra';
import { enableRequireTsFile, loadFileFromRoot, loadJS, loadJson, loadTS, readPackageJson, refreshJson, refreshTsOrJs } from '../../../src/composites/loader';
import { Printer } from '../../../src/utils/print';

const TEST_DIR = path.resolve(__dirname, '../../../__tests__tmp__/loader-test');

describe('loader', () => {
  beforeEach(() => {
    fs.emptyDirSync(TEST_DIR);
    jest.spyOn(Printer, 'log').mockImplementation(() => undefined);
    jest.spyOn(Printer, 'warn').mockImplementation(() => undefined);
    jest.spyOn(Printer, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  afterAll(() => {
    fs.removeSync(TEST_DIR);
  });

  it('loadJson 应解析 JSON5、使用缓存并支持强制刷新', async () => {
    const filePath = path.join(TEST_DIR, 'data.json5');
    fs.writeFileSync(filePath, '{ value: 1, }');

    await expect(loadJson(filePath, { noLogPrint: true })).resolves.toEqual({ value: 1 });
    fs.writeFileSync(filePath, '{ value: 2, }');
    await expect(loadJson(filePath, { noLogPrint: true })).resolves.toEqual({ value: 1 });
    await expect(loadJson(filePath, { noCache: true, noLogPrint: true })).resolves.toEqual({ value: 2 });
    refreshJson(filePath);
    fs.writeFileSync(filePath, '{ value: 3, }');
    await expect(loadJson(filePath, { noLogPrint: true })).resolves.toEqual({ value: 3 });
  });

  it('loadJson 在文件无效或不存在时应返回空对象', async () => {
    const invalidPath = path.join(TEST_DIR, 'invalid.json');
    fs.writeFileSync(invalidPath, 'invalid json');

    await expect(loadJson(invalidPath, { noLogPrint: true })).resolves.toEqual({});
    await expect(loadJson(path.join(TEST_DIR, 'missing.json'), { noLogPrint: true })).resolves.toEqual({});
    expect(Printer.error).toHaveBeenCalled();
  });

  it('loadJS 应加载 CommonJS 模块并安全处理加载失败', async () => {
    const filePath = path.join(TEST_DIR, 'module.cjs');
    fs.writeFileSync(filePath, 'module.exports = { value: 1 };');

    await expect(loadJS<{ value: number }>(filePath, { noLogPrint: true })).resolves.toEqual({ value: 1 });
    await expect(loadJS(path.join(TEST_DIR, 'missing.cjs'), { noLogPrint: true })).resolves.toBeNull();
    expect(() => refreshTsOrJs(path.join(TEST_DIR, 'missing.cjs'))).not.toThrow();
  });

  it('loadTS 应读取默认导出', async () => {
    const filePath = path.join(TEST_DIR, 'module.ts');
    fs.writeFileSync(filePath, 'const value = { enabled: true }; export default value;');

    enableRequireTsFile();
    await expect(loadTS<{ enabled: boolean }>(filePath, { noLogPrint: true })).resolves.toEqual({ enabled: true });
  });

  it('应从包根目录读取文件和 package.json', () => {
    const pkg = readPackageJson();

    expect(loadFileFromRoot<{ name: string }>('./package.json').name).toBe('mihawk');
    expect(pkg.name).toBe('mihawk');
  });
});
