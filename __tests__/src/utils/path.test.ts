'use strict';
import path from 'path';
import {
  absifyPath,
  unixifyPath,
  isExistedSync,
  getLogicFileExt,
  getRoutesFileExt,
  removeSpecialExt,
  formatMockPath,
  getRouteByJsonPath,
  isPathInDir,
} from '../../../src/utils/path';

describe('absifyPath', () => {
  it('绝对路径应保持不变', () => {
    const absPath = path.resolve('/test/path');
    expect(absifyPath(absPath)).toBe(absPath.replace(/[/\\]+$/, ''));
  });
  it('相对路径应转为绝对路径', () => {
    const result = absifyPath('test/path');
    expect(path.isAbsolute(result)).toBe(true);
  });
  it('应消除末尾的斜杠和反斜杠', () => {
    expect(absifyPath('/test/path/')).toBe('/test/path');
    expect(absifyPath('/test/path\\')).toBe('/test/path');
  });
  it('空字符串应返回 rootPath', () => {
    const rootPath = path.resolve('/root');
    expect(absifyPath('', rootPath)).toBe(rootPath);
  });
});

describe('unixifyPath', () => {
  it('win32 平台应将反斜杠转为斜杠', () => {
    if (process.platform === 'win32') {
      expect(unixifyPath('\\a\\b\\c')).toBe('/a/b/c');
      expect(unixifyPath('C:\\Users\\test')).toBe('C:/Users/test');
    } else {
      expect(unixifyPath('/a/b/c')).toBe('/a/b/c');
    }
  });
});

describe('isExistedSync', () => {
  it('存在的文件应返回 true', () => {
    expect(isExistedSync('package.json')).toBe(true);
  });
  it('不存在的文件应返回 false', () => {
    expect(isExistedSync('not-exist-file-12345.txt')).toBe(false);
  });
  it('空字符串应返回 false', () => {
    expect(isExistedSync('')).toBe(false);
  });
});

describe('getLogicFileExt', () => {
  it('js 类型应返回 js', () => {
    expect(getLogicFileExt('js')).toBe('js');
    expect(getLogicFileExt('javascript')).toBe('js');
  });
  it('cjs 类型应返回 cjs', () => {
    expect(getLogicFileExt('cjs')).toBe('cjs');
  });
  it('ts 类型应返回 ts', () => {
    expect(getLogicFileExt('ts')).toBe('ts');
    expect(getLogicFileExt('typescript')).toBe('ts');
  });
  it('none 或其他类型应返回空字符串', () => {
    expect(getLogicFileExt('none')).toBe('');
    expect(getLogicFileExt('json' as any)).toBe('');
  });
});

describe('getRoutesFileExt', () => {
  it('逻辑文件类型应返回对应后缀', () => {
    expect(getRoutesFileExt('js')).toBe('js');
    expect(getRoutesFileExt('ts')).toBe('ts');
  });
  it('none 类型应返回 json', () => {
    expect(getRoutesFileExt('none')).toBe('json');
  });
});

describe('removeSpecialExt', () => {
  it('应移除支持的后缀', () => {
    expect(removeSpecialExt('file.js')).toBe('file');
    expect(removeSpecialExt('file.cjs')).toBe('file');
    expect(removeSpecialExt('file.ts')).toBe('file');
    expect(removeSpecialExt('file.json')).toBe('file');
    expect(removeSpecialExt('file.json5')).toBe('file');
  });
  it('不应移除不支持的后缀', () => {
    expect(removeSpecialExt('file.css')).toBe('file.css');
    expect(removeSpecialExt('file.txt')).toBe('file.txt');
  });
  it('应只移除末尾的后缀', () => {
    expect(removeSpecialExt('file.js.txt')).toBe('file.js.txt');
  });
});

describe('formatMockPath', () => {
  it('应移除文件后缀', () => {
    expect(formatMockPath('/test/a/b.json')).toBe('/test/a/b');
    expect(formatMockPath('/test/a/b.ts')).toBe('/test/a/b');
  });
  it('末尾有斜杠应增加 index', () => {
    expect(formatMockPath('/test/a/')).toBe('/test/a/index');
  });
  it('应规范化路径', () => {
    expect(formatMockPath('/test/./a/../b.json')).toBe('/test/b');
  });
});

describe('getRouteByJsonPath', () => {
  it('应解析标准路径', () => {
    expect(getRouteByJsonPath('GET/a/b/c.json')).toEqual({ method: 'GET', path: '/a/b/c' });
  });
  it('应解析带前导斜杠的路径', () => {
    expect(getRouteByJsonPath('/GET/a/b/c.json')).toEqual({ method: 'GET', path: '/a/b/c' });
  });
  it('应支持大小写 method', () => {
    expect(getRouteByJsonPath('get/a/b/c.json')).toEqual({ method: 'GET', path: '/a/b/c' });
    expect(getRouteByJsonPath('Get/a/b/c.json')).toEqual({ method: 'GET', path: '/a/b/c' });
  });
  it('应支持自定义 method', () => {
    expect(getRouteByJsonPath('myDiy/a/b/c.json')).toEqual({ method: 'MYDIY', path: '/a/b/c' });
  });
  it('应支持自定义 json 后缀', () => {
    expect(getRouteByJsonPath('GET/a/b/c.json5', 'json5')).toEqual({ method: 'GET', path: '/a/b/c' });
  });
});

describe('isPathInDir', () => {
  it('子路径应返回 true', () => {
    expect(isPathInDir('a/b/c/d.txt', 'a/b/c')).toBe(true);
  });
  it('相同路径应返回 false', () => {
    expect(isPathInDir('a/b/c', 'a/b/c')).toBe(false);
  });
  it('非子路径应返回 false', () => {
    expect(isPathInDir('x/y/z', 'a/b/c')).toBe(false);
  });
});
