'use strict';
import { parseStompMsg } from '../../../src/utils/parser';

describe('parseStompMsg', () => {
  it('应正确解析标准 STOMP 消息', () => {
    const raw = 'SEND\ndestination:/queue/test\ncontent-type:text/plain\n\nhello world\n';
    const msg = parseStompMsg(raw);
    expect(msg.command).toBe('SEND');
    expect(msg.headers).toEqual({
      destination: '/queue/test',
      'content-type': 'text/plain',
    });
    expect(msg.body).toBe('hello world');
  });

  it('应正确解析无 body 的 STOMP 消息', () => {
    const raw = 'CONNECT\naccept-version:1.2\nhost:localhost\n\n';
    const msg = parseStompMsg(raw);
    expect(msg.command).toBe('CONNECT');
    expect(msg.headers).toEqual({
      'accept-version': '1.2',
      host: 'localhost',
    });
    expect(msg.body).toBe('');
  });

  it('应处理空字符串输入', () => {
    const msg = parseStompMsg('');
    expect(msg.command).toBe('UnkonwnCommand');
    expect(msg.headers).toBeNull();
    expect(msg.body).toContain('Exception');
  });

  it('应处理非字符串输入', () => {
    const msg = parseStompMsg(null as any);
    expect(msg.command).toBe('UnkonwnCommand');
    expect(msg.headers).toBeNull();
    expect(msg.body).toContain('Exception');
  });

  it('应正确解析多行 body', () => {
    const raw = 'SEND\ndestination:/queue/test\n\nline1\nline2\nline3\n';
    const msg = parseStompMsg(raw);
    expect(msg.body).toBe('line1\nline2\nline3');
  });

  it('应正确解析仅有 command 的消息', () => {
    const raw = 'DISCONNECT\n\n';
    const msg = parseStompMsg(raw);
    expect(msg.command).toBe('DISCONNECT');
    expect(msg.headers).toEqual({});
    expect(msg.body).toBe('');
  });
});
