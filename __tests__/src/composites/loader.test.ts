'use strict';
import { execFileSync } from 'child_process';
import path from 'path';
import * as fs from 'fs-extra';
import {
  enableRequireTsFile,
  loadFileFromRoot,
  loadJS,
  loadJson,
  loadTS,
  readPackageJson,
  refreshJson,
  refreshMockModuleGraph,
  refreshTsOrJs,
} from '../../../src/composites/loader';
import { Printer } from '../../../src/utils/print';

const PROJECT_ROOT = path.resolve(__dirname, '../../..');
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

  it('loadTS 应从当前 TypeScript 模块解析依赖并保持缓存刷新关系', () => {
    const featureDir = path.join(TEST_DIR, 'feature');
    const sharedDir = path.join(TEST_DIR, 'shared');
    const packageDir = path.join(TEST_DIR, 'node_modules/mihawk-loader-test-package');
    const harnessPath = path.join(TEST_DIR, 'loader-harness.cjs');
    const entryPath = path.join(featureDir, 'entry.ts');
    const helperPath = path.join(featureDir, 'helper.ts');
    const sharedPath = path.join(sharedDir, 'value.ts');
    const unrelatedPath = path.join(TEST_DIR, 'unrelated.cjs');
    const loaderPath = path.join(PROJECT_ROOT, 'src/composites/loader.ts');

    fs.ensureDirSync(featureDir);
    fs.ensureDirSync(sharedDir);
    fs.ensureDirSync(packageDir);
    fs.writeFileSync(helperPath, "export const helperValue = 'v1';\n");
    fs.writeFileSync(sharedPath, "export const sharedValue = 'shared';\n");
    fs.writeFileSync(path.join(packageDir, 'index.js'), "module.exports = 'local-package';\n");
    fs.writeFileSync(unrelatedPath, "module.exports = 'unrelated';\n");
    fs.writeFileSync(
      entryPath,
      [
        "import packageValue from 'mihawk-loader-test-package';",
        "import { helperValue } from './helper';",
        "import { sharedValue } from '../shared/value';",
        '',
        "const resolvedHelper = require.resolve('./helper');",
        '',
        'export default {',
        '  helperValue,',
        '  sharedValue,',
        '  packageValue,',
        '  resolvedHelper,',
        "  resolvePaths: require.resolve.paths('mihawk-loader-test-package'),",
        '  cache: require.cache,',
        '  extensions: require.extensions,',
        '  main: require.main,',
        "  hasMain: 'main' in require,",
        '  filename: __filename,',
        '  dirname: __dirname,',
        '};',
        '',
      ].join('\n'),
    );
    fs.writeFileSync(
      harnessPath,
      [
        "'use strict';",
        "const assert = require('assert/strict');",
        "const fs = require('fs');",
        "const path = require('path');",
        '',
        'const [loaderPath, entryPath, helperPath, unrelatedPath] = process.argv.slice(2);',
        '',
        'async function run() {',
        '  const loader = require(loaderPath);',
        "  delete require.extensions['.ts'];",
        '  loader.enableRequireTsFile();',
        '',
        '  const first = await loader.loadTS(entryPath, { noLogPrint: true });',
        "  assert.ok(first, 'loadTS should return the default export');",
        "  assert.strictEqual(first.helperValue, 'v1');",
        "  assert.strictEqual(first.sharedValue, 'shared');",
        "  assert.strictEqual(first.packageValue, 'local-package');",
        '  assert.strictEqual(first.resolvedHelper, helperPath);',
        "  assert.strictEqual(typeof first.resolvePaths?.includes, 'function');",
        "  assert.ok(first.resolvePaths.includes(path.join(path.dirname(entryPath), 'node_modules')));",
        '  assert.strictEqual(first.cache, require.cache);',
        '  assert.strictEqual(first.extensions, require.extensions);',
        '  assert.strictEqual(first.main, require.main);',
        '  assert.strictEqual(first.hasMain, true);',
        '  assert.strictEqual(first.filename, entryPath);',
        '  assert.strictEqual(first.dirname, path.dirname(entryPath));',
        '',
        '  const entryModule = require.cache[entryPath];',
        '  const helperModule = require.cache[helperPath];',
        '  assert.ok(entryModule.children.includes(helperModule));',
        '  assert.strictEqual(helperModule.parent, entryModule);',
        '',
        '  require(unrelatedPath);',
        '  const unrelatedModule = require.cache[unrelatedPath];',
        '  fs.writeFileSync(helperPath, "export const helperValue = \'v2\';\\n");',
        '  loader.refreshTsOrJs(helperPath);',
        '  assert.strictEqual(require.cache[helperPath], undefined);',
        '  assert.strictEqual(require.cache[entryPath], undefined);',
        '  assert.strictEqual(require.cache[unrelatedPath], unrelatedModule);',
        '',
        '  const second = await loader.loadTS(entryPath, { noLogPrint: true });',
        "  assert.strictEqual(second.helperValue, 'v2');",
        '  process.stdout.write(JSON.stringify({ helperValue: second.helperValue }));',
        '}',
        '',
        'run().catch(error => {',
        "  process.stderr.write(String(error?.stack || error) + '\\n');",
        '  process.exitCode = 1;',
        '});',
        '',
      ].join('\n'),
    );

    const output = execFileSync(
      process.execPath,
      ['--require', require.resolve('ts-node/register/transpile-only'), harnessPath, loaderPath, entryPath, helperPath, unrelatedPath],
      {
        cwd: PROJECT_ROOT,
        encoding: 'utf8',
        timeout: 10000,
        env: {
          ...process.env,
          TS_NODE_PROJECT: path.join(PROJECT_ROOT, 'tsconfig.cjs.json'),
        },
      },
    );

    expect(JSON.parse(output)).toEqual({ helperValue: 'v2' });
  }, 15000);

  it('refreshMockModuleGraph 应清除共享依赖的所有反向引用模块', () => {
    const sharedDir = path.join(TEST_DIR, 'shared-runtime');
    const harnessPath = path.join(TEST_DIR, 'shared-runtime-harness.cjs');
    const middlewarePath = path.join(TEST_DIR, 'middleware.ts');
    const socketPath = path.join(TEST_DIR, 'socket.ts');
    const runtimePath = path.join(sharedDir, 'runtime.ts');
    const versionPath = path.join(sharedDir, 'version.ts');
    const unrelatedPath = path.join(TEST_DIR, 'unrelated.cjs');
    const loaderPath = path.join(PROJECT_ROOT, 'src/composites/loader.ts');

    fs.ensureDirSync(sharedDir);
    fs.writeFileSync(versionPath, "export const version = 'v1';\n");
    fs.writeFileSync(runtimePath, "import { version } from './version';\nexport default { version };\n");
    fs.writeFileSync(middlewarePath, "import runtime from './shared-runtime/runtime';\nexport default { runtime };\n");
    fs.writeFileSync(socketPath, "import runtime from './shared-runtime/runtime';\nexport default { runtime };\n");
    fs.writeFileSync(unrelatedPath, "module.exports = 'unrelated';\n");
    fs.writeFileSync(
      harnessPath,
      [
        "'use strict';",
        "const assert = require('assert/strict');",
        "const fs = require('fs');",
        "const path = require('path');",
        '',
        'const [loaderPath, middlewarePath, socketPath, runtimePath, versionPath, unrelatedPath] = process.argv.slice(2);',
        '',
        'async function run() {',
        '  const loader = require(loaderPath);',
        "  delete require.extensions['.ts'];",
        '  loader.enableRequireTsFile();',
        '',
        '  const loaderModule = require.cache[loaderPath];',
        '  const firstMiddleware = await loader.loadTS(middlewarePath, { noLogPrint: true });',
        '  const firstSocket = await loader.loadTS(socketPath, { noLogPrint: true });',
        "  assert.ok(firstMiddleware, 'middleware should load');",
        "  assert.ok(firstSocket, 'socket should load');",
        '  assert.strictEqual(firstMiddleware.runtime, firstSocket.runtime);',
        "  assert.strictEqual(firstMiddleware.runtime.version, 'v1');",
        '',
        '  require(unrelatedPath);',
        '  const unrelatedModule = require.cache[unrelatedPath];',
        '  const modulePaths = [middlewarePath, socketPath, runtimePath, versionPath];',
        '  const firstModules = modulePaths.map(modulePath => require.cache[modulePath]);',
        '  const countTrackedChildren = () =>',
        '    Object.values(require.cache).reduce(',
        '      (count, cachedModule) => count + cachedModule.children.filter(child => modulePaths.includes(child.filename)).length,',
        '      0,',
        '    );',
        '  const assertOldModulesDetached = oldModules => {',
        '    const oldModuleSet = new Set(oldModules);',
        '    for (const cachedModule of Object.values(require.cache)) {',
        '      assert.strictEqual(cachedModule.children.some(child => oldModuleSet.has(child)), false);',
        '    }',
        '  };',
        '  const assertMockModulesCleared = () => {',
        '    for (const modulePath of modulePaths) {',
        '      assert.strictEqual(require.cache[modulePath], undefined);',
        '    }',
        '  };',
        '  const initialTrackedChildrenCount = countTrackedChildren();',
        '',
        '  fs.writeFileSync(versionPath, "export const version = \'v2\';\\n");',
        '  loader.refreshMockModuleGraph(versionPath, { mockDir: path.dirname(middlewarePath) });',
        '',
        '  assertMockModulesCleared();',
        '  assert.strictEqual(require.cache[loaderPath], loaderModule);',
        '  assert.strictEqual(require.cache[unrelatedPath], unrelatedModule);',
        '  assertOldModulesDetached(firstModules);',
        '',
        '  const secondMiddleware = await loader.loadTS(middlewarePath, { noLogPrint: true });',
        '  const secondSocket = await loader.loadTS(socketPath, { noLogPrint: true });',
        '  assert.strictEqual(secondMiddleware.runtime, secondSocket.runtime);',
        "  assert.strictEqual(secondMiddleware.runtime.version, 'v2');",
        '  assert.notStrictEqual(secondMiddleware.runtime, firstMiddleware.runtime);',
        '  assert.strictEqual(countTrackedChildren(), initialTrackedChildrenCount);',
        '',
        '  const secondModules = modulePaths.map(modulePath => require.cache[modulePath]);',
        '  fs.writeFileSync(versionPath, "export const version = \'v3\';\\n");',
        '  loader.refreshMockModuleGraph(versionPath, { mockDir: path.dirname(middlewarePath) });',
        '  assertMockModulesCleared();',
        '  assertOldModulesDetached(secondModules);',
        '  assert.strictEqual(require.cache[loaderPath], loaderModule);',
        '  assert.strictEqual(require.cache[unrelatedPath], unrelatedModule);',
        '',
        '  const thirdMiddleware = await loader.loadTS(middlewarePath, { noLogPrint: true });',
        '  const thirdSocket = await loader.loadTS(socketPath, { noLogPrint: true });',
        '  assert.strictEqual(thirdMiddleware.runtime, thirdSocket.runtime);',
        "  assert.strictEqual(thirdMiddleware.runtime.version, 'v3');",
        '  assert.notStrictEqual(thirdMiddleware.runtime, secondMiddleware.runtime);',
        '  assert.strictEqual(countTrackedChildren(), initialTrackedChildrenCount);',
        '  process.stdout.write(JSON.stringify({ version: thirdMiddleware.runtime.version }));',
        '}',
        '',
        'run().catch(error => {',
        "  process.stderr.write(String(error?.stack || error) + '\\n');",
        '  process.exitCode = 1;',
        '});',
        '',
      ].join('\n'),
    );

    const output = execFileSync(
      process.execPath,
      ['--require', require.resolve('ts-node/register/transpile-only'), harnessPath, loaderPath, middlewarePath, socketPath, runtimePath, versionPath, unrelatedPath],
      {
        cwd: PROJECT_ROOT,
        encoding: 'utf8',
        timeout: 10000,
        env: {
          ...process.env,
          TS_NODE_PROJECT: path.join(PROJECT_ROOT, 'tsconfig.cjs.json'),
        },
      },
    );

    expect(JSON.parse(output)).toEqual({ version: 'v3' });
  }, 15000);

  it('refreshMockModuleGraph 应在循环依赖中安全终止', () => {
    const cycleDir = path.join(TEST_DIR, 'cycle');
    const harnessPath = path.join(TEST_DIR, 'cycle-harness.cjs');
    const entryPath = path.join(cycleDir, 'entry.ts');
    const firstPath = path.join(cycleDir, 'first.ts');
    const secondPath = path.join(cycleDir, 'second.ts');
    const loaderPath = path.join(PROJECT_ROOT, 'src/composites/loader.ts');

    fs.ensureDirSync(cycleDir);
    fs.writeFileSync(entryPath, "import { firstValue } from './first';\nexport default { firstValue };\n");
    fs.writeFileSync(firstPath, "import './second';\nexport const firstValue = 'first';\n");
    fs.writeFileSync(secondPath, "import './first';\nexport const secondValue = 'second';\n");
    fs.writeFileSync(
      harnessPath,
      [
        "'use strict';",
        "const assert = require('assert/strict');",
        '',
        'const [loaderPath, mockDir, entryPath, firstPath, secondPath] = process.argv.slice(2);',
        '',
        'async function run() {',
        '  const loader = require(loaderPath);',
        "  delete require.extensions['.ts'];",
        '  loader.enableRequireTsFile();',
        '  const entry = await loader.loadTS(entryPath, { noLogPrint: true });',
        "  assert.strictEqual(entry.firstValue, 'first');",
        '',
        '  loader.refreshMockModuleGraph(firstPath, { mockDir });',
        '  assert.strictEqual(require.cache[entryPath], undefined);',
        '  assert.strictEqual(require.cache[firstPath], undefined);',
        '  assert.strictEqual(require.cache[secondPath], undefined);',
        "  process.stdout.write('cleared');",
        '}',
        '',
        'run().catch(error => {',
        "  process.stderr.write(String(error?.stack || error) + '\\n');",
        '  process.exitCode = 1;',
        '});',
        '',
      ].join('\n'),
    );

    const output = execFileSync(
      process.execPath,
      ['--require', require.resolve('ts-node/register/transpile-only'), harnessPath, loaderPath, cycleDir, entryPath, firstPath, secondPath],
      {
        cwd: PROJECT_ROOT,
        encoding: 'utf8',
        timeout: 10000,
        env: {
          ...process.env,
          TS_NODE_PROJECT: path.join(PROJECT_ROOT, 'tsconfig.cjs.json'),
        },
      },
    );

    expect(output).toBe('cleared');
  }, 15000);

  it('refreshMockModuleGraph 应严格限定在 mockDir 内且排除 node_modules', () => {
    const mockDir = path.join(TEST_DIR, 'mocks');

    expect(refreshMockModuleGraph(path.join(TEST_DIR, 'mocks-old/module.ts'), { mockDir })).toEqual([]);
    expect(refreshMockModuleGraph(path.join(mockDir, 'node_modules/package/index.js'), { mockDir })).toEqual([]);
  });

  it('应从包根目录读取文件和 package.json', () => {
    const pkg = readPackageJson();

    expect(loadFileFromRoot<{ name: string }>('./package.json').name).toBe('mihawk');
    expect(pkg.name).toBe('mihawk');
  });
});
