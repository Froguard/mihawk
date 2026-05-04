'use strict';
import * as fs from 'fs-extra';
import * as path from 'path';
import { writeFileSafeSync, writeJSONSafeSync, readFileSafeSync, readJsonSafeSync } from '../../../src/utils/file';

const TEST_DIR = path.resolve(__dirname, '../../../__tests__tmp__/file-test');

describe('file utils', () => {
  beforeEach(() => {
    fs.ensureDirSync(TEST_DIR);
    fs.emptyDirSync(TEST_DIR);
  });

  afterAll(() => {
    fs.removeSync(TEST_DIR);
  });

  describe('writeFileSafeSync', () => {
    it('应写入文件内容', () => {
      const filePath = path.join(TEST_DIR, 'test.txt');
      writeFileSafeSync(filePath, 'hello world');
      expect(fs.readFileSync(filePath, 'utf-8')).toBe('hello world');
    });

    it('应自动创建不存在的目录', () => {
      const filePath = path.join(TEST_DIR, 'deep/nested/dir/test.txt');
      writeFileSafeSync(filePath, 'content');
      expect(fs.existsSync(filePath)).toBe(true);
      expect(fs.readFileSync(filePath, 'utf-8')).toBe('content');
    });

    it('空路径应安全处理', () => {
      expect(() => writeFileSafeSync('', 'content')).not.toThrow();
    });
  });

  describe('writeJSONSafeSync', () => {
    it('应写入 JSON 文件', () => {
      const filePath = path.join(TEST_DIR, 'test.json');
      const data = { name: 'test', value: 123 };
      writeJSONSafeSync(filePath, data);
      const content = fs.readFileSync(filePath, 'utf-8');
      expect(JSON.parse(content)).toEqual(data);
    });

    it('应自动创建不存在的目录', () => {
      const filePath = path.join(TEST_DIR, 'deep/nested/test.json');
      writeJSONSafeSync(filePath, { a: 1 });
      expect(fs.existsSync(filePath)).toBe(true);
    });

    it('空路径应安全处理', () => {
      expect(() => writeJSONSafeSync('', { a: 1 })).not.toThrow();
    });
  });

  describe('readFileSafeSync', () => {
    it('应读取文件内容', () => {
      const filePath = path.join(TEST_DIR, 'read.txt');
      fs.writeFileSync(filePath, 'file content');
      expect(readFileSafeSync(filePath)).toBe('file content');
    });

    it('文件不存在时应返回空字符串', () => {
      const filePath = path.join(TEST_DIR, 'not-exist.txt');
      expect(readFileSafeSync(filePath)).toBe('');
    });

    it('空路径应返回空字符串', () => {
      expect(readFileSafeSync('')).toBe('');
    });

    it('应支持自定义编码', () => {
      const filePath = path.join(TEST_DIR, 'encoding.txt');
      fs.writeFileSync(filePath, 'hello');
      expect(readFileSafeSync(filePath, { encoding: 'utf-8' })).toBe('hello');
    });
  });

  describe('readJsonSafeSync', () => {
    it('应读取并解析 JSON 文件', () => {
      const filePath = path.join(TEST_DIR, 'data.json');
      fs.writeFileSync(filePath, JSON.stringify({ foo: 'bar' }));
      expect(readJsonSafeSync(filePath)).toEqual({ foo: 'bar' });
    });

    it('应支持 JSON5 语法', () => {
      const filePath = path.join(TEST_DIR, 'data.json5');
      fs.writeFileSync(filePath, '{ foo: "bar", /* comment */ }');
      expect(readJsonSafeSync(filePath)).toEqual({ foo: 'bar' });
    });

    it('文件不存在时应返回 null', () => {
      const filePath = path.join(TEST_DIR, 'not-exist.json');
      expect(readJsonSafeSync(filePath)).toBeNull();
    });

    it('空路径应返回 null', () => {
      expect(readJsonSafeSync('')).toBeNull();
    });

    it('解析失败时应返回空对象', () => {
      const filePath = path.join(TEST_DIR, 'bad.json');
      fs.writeFileSync(filePath, 'not json at all');
      expect(readJsonSafeSync(filePath)).toEqual({});
    });
  });
});
