'use strict';
import path from 'path';
import * as fs from 'fs-extra';
import { formatOptionsByConfig, getRcData, initRCfile } from '../../../src/composites/rc';
import { Printer } from '../../../src/utils/print';

const TEST_ROOT = path.resolve(__dirname, '../../../__tests__tmp__/rc-test');
const TEST_ROOT_REL = path.relative(process.cwd(), TEST_ROOT);

describe('rc', () => {
  beforeEach(() => {
    fs.emptyDirSync(TEST_ROOT);
    jest.spyOn(Printer, 'log').mockImplementation(() => undefined);
    jest.spyOn(Printer, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  afterAll(() => {
    fs.removeSync(TEST_ROOT);
  });

  it('initRCfile 应生成 JSON 配置并添加 schema', async () => {
    const name = path.join(TEST_ROOT_REL, '.testrc');
    const config = { port: 9000 };

    await initRCfile(name, { fileType: 'json', initConfig: config });

    expect(fs.readJsonSync(path.join(TEST_ROOT, '.testrc.json'))).toEqual({
      port: 9000,
      $schema: './node_modules/mihawk/assets/schema/root-config.json',
    });
  });

  it('initRCfile 应生成 JavaScript 和 TypeScript 配置', async () => {
    const jsName = path.join(TEST_ROOT_REL, 'config-js');
    const tsName = path.join(TEST_ROOT_REL, 'config-ts');

    await initRCfile(jsName, { fileType: 'js', initConfig: { watch: false } });
    await initRCfile(tsName, {
      fileType: 'ts',
      initConfig: { watch: true },
      tsInfo: { typeName: 'MihawkRC', typeImportId: 'mihawk/com-types' },
    });

    expect(fs.readFileSync(path.join(TEST_ROOT, 'config-js.js'), 'utf-8')).toContain('module.exports =');
    const tsContent = fs.readFileSync(path.join(TEST_ROOT, 'config-ts.ts'), 'utf-8');
    expect(tsContent).toContain("import type { MihawkRC } from 'mihawk/com-types';");
    expect(tsContent).toContain('export default config;');
  });

  it('initRCfile 默认不应覆盖已有文件', async () => {
    const name = path.join(TEST_ROOT_REL, 'keep');
    const filePath = path.join(TEST_ROOT, 'keep.json');
    fs.writeFileSync(filePath, '{"kept":true}');

    await initRCfile(name, { fileType: 'json', initConfig: { kept: false } });

    expect(fs.readJsonSync(filePath)).toEqual({ kept: true });
  });

  it('getRcData 在配置不存在时应创建并返回初始配置', async () => {
    const name = path.join(TEST_ROOT_REL, 'auto');

    await expect(getRcData(name, { initConfig: { port: 7000 } })).resolves.toEqual({
      port: 7000,
      $schema: './node_modules/mihawk/assets/schema/root-config.json',
    });
    expect(fs.existsSync(path.join(TEST_ROOT, 'auto.json'))).toBe(true);
  });

  it('formatOptionsByConfig 应解析别名、类型和派生路径', () => {
    const options = formatOptionsByConfig({
      p: '9001',
      d: './custom-mocks',
      w: 'false',
      mockDataFileType: 'json5',
      mockLogicFileType: 'ts',
      https: { key: 'key', cert: 'cert' },
      socketConfig: true,
      setJsonByRemote: { enable: true, target: 'https://example.com' },
    });

    expect(options.port).toBe(9001);
    expect(options.watch).toBe(false);
    expect(options.mockDirPath).toBe(path.resolve('./custom-mocks'));
    expect(options.mockDataDirPath).toBe(path.join(options.mockDirPath, 'data'));
    expect(options.routesFilePath).toBe(path.join(options.mockDirPath, 'routes.ts'));
    expect(options.middlewareFilePath).toBe(path.join(options.mockDirPath, 'middleware.ts'));
    expect(options).toMatchObject({
      dataFileExt: 'json5',
      logicFileExt: 'ts',
      isTypesctiptMode: true,
      useLogicFile: true,
      useHttps: true,
      useWS: true,
      useRemoteData: true,
    });
  });
});
