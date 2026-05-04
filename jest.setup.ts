'use strict';
/**
 * Jest 测试环境初始化
 * - Node.js 18+ 支持 Web Streams，但 Jest 27 的 node 测试环境未自动暴露这些全局变量
 * - Koa 3.x 依赖 ReadableStream/Blob/Response 等 Web API，需手动注入
 */
import { ReadableStream, WritableStream, TransformStream } from 'stream/web';
import { Blob } from 'buffer';

// Koa 3.x 只通过 instanceof 检查 Response，提供一个最小化实现即可
class FakeResponse {
  constructor(
    public body?: any,
    public init?: any,
  ) {}
  get headers() {
    return new Map();
  }
  get status() {
    return this.init?.status || 200;
  }
  json() {
    return Promise.resolve(this.body);
  }
  text() {
    return Promise.resolve(String(this.body));
  }
}

Object.assign(global, {
  ReadableStream,
  WritableStream,
  TransformStream,
  Blob,
  Response: FakeResponse,
  Headers: (global as any).Headers || class FakeHeaders extends Map {},
  FormData: (global as any).FormData || class FakeFormData {},
  URLSearchParams: (global as any).URLSearchParams,
});
