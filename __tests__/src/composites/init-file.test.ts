'use strict';
import path from 'path';
import * as fs from 'fs-extra';
import { initMockDataDir, initMockLogicFile, initMockMiddlewareFile, initMockRoutesFile } from '../../../src/composites/init-file';
import { Printer } from '../../../src/utils/print';

const TEST_ROOT = path.resolve(__dirname, '../../../__tests__tmp__/init-file-test');
const TEST_ROOT_REL = path.relative(process.cwd(), TEST_ROOT);

describe('init-file', () => {
  beforeEach(() => {
    fs.emptyDirSync(TEST_ROOT);
    jest.spyOn(Printer, 'log').mockImplementation(() => undefined);
    jest.spyOn(Printer, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  afterAll(() => {
    fs.removeSync(TEST_ROOT);
  });

  it('initMockDataDir 应创建方法目录、占位文件和示例数据', async () => {
    await initMockDataDir(TEST_ROOT_REL);

    for (const method of ['PUT', 'DELETE', 'POST', 'GET']) {
      expect(fs.existsSync(path.join(TEST_ROOT, 'data', method, '.gitkeep'))).toBe(true);
    }
    expect(fs.readJsonSync(path.join(TEST_ROOT, 'data/GET/test.json'))).toMatchObject({ code: 200, message: 'success' });
  });

  it('initMockRoutesFile 应按逻辑类型生成对应文件', async () => {
    const jsonDir = path.join(TEST_ROOT_REL, 'json');
    const tsDir = path.join(TEST_ROOT_REL, 'ts');

    await initMockRoutesFile('none', jsonDir);
    await initMockRoutesFile('ts', tsDir);

    expect(fs.readJsonSync(path.join(TEST_ROOT, 'json/routes.json'))).toEqual({
      'GET /test': './GET/test',
      'GET /test-*': './GET/test',
    });
    expect(fs.readFileSync(path.join(TEST_ROOT, 'ts/routes.ts'), 'utf-8')).toContain('export default routes;');
  });

  it('initMockMiddlewareFile 应生成 CommonJS 或 TypeScript 中间件', async () => {
    const cjsDir = path.join(TEST_ROOT_REL, 'cjs');
    const tsDir = path.join(TEST_ROOT_REL, 'ts');

    await initMockMiddlewareFile('none', cjsDir);
    await initMockMiddlewareFile('ts', tsDir);

    expect(fs.readFileSync(path.join(TEST_ROOT, 'cjs/middleware.cjs'), 'utf-8')).toContain('module.exports = async function middleware');
    expect(fs.readFileSync(path.join(TEST_ROOT, 'ts/middleware.ts'), 'utf-8')).toContain('export default async function middleware');
  });

  it('initMockLogicFile 应生成可转换数据的 JS 和 TS 模板', () => {
    const jsPath = path.join(TEST_ROOT, 'logic.cjs');
    const tsPath = path.join(TEST_ROOT, 'logic.ts');
    const baseOptions = { routePath: 'GET /test', logicPath4log: './GET/test', jsonPath4log: './GET/test.json' };

    initMockLogicFile(jsPath, { ...baseOptions, logicFileExt: 'cjs' });
    initMockLogicFile(tsPath, { ...baseOptions, logicFileExt: 'ts' });

    expect(fs.readFileSync(jsPath, 'utf-8')).toContain('module.exports = async function convertData');
    expect(fs.readFileSync(tsPath, 'utf-8')).toContain('export default async function convertData');
  });

  it('initMockLogicFile 缺少后缀时应跳过创建', () => {
    const filePath = path.join(TEST_ROOT, 'logic');

    initMockLogicFile(filePath, {
      routePath: 'GET /test',
      logicFileExt: '',
      logicPath4log: './GET/test',
      jsonPath4log: './GET/test.json',
    });

    expect(fs.existsSync(filePath)).toBe(false);
    expect(Printer.warn).toHaveBeenCalledWith('Empty logic file ext, skip init logic file.');
  });
});
