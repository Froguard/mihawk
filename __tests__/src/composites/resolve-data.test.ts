'use strict';
import { safeFetchRemoteData } from '../../../src/composites/resolve-data';
import { Printer } from '../../../src/utils/print';
import type { MihawkOptions } from '../../../src/com-types';

describe('safeFetchRemoteData', () => {
  let fetchMock: jest.Mock;

  beforeEach(() => {
    jest.spyOn(Printer, 'log').mockImplementation(() => undefined);
    jest.spyOn(Printer, 'error').mockImplementation(() => undefined);
    fetchMock = jest.fn().mockResolvedValue({
      headers: { get: () => 'application/json' },
      json: async () => ({ success: true }),
    });
    global.fetch = fetchMock;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('应固定 target base path 并禁止自动重定向', async () => {
    const result = await safeFetchRemoteData('/users?id=1', { method: 'GET', headers: {} }, {
      setJsonByRemote: { enable: true, target: 'https://api.example.com/v1' },
    } as MihawkOptions);

    expect(result).toMatchObject({ success: true });
    expect(fetchMock).toHaveBeenCalledWith('https://api.example.com/v1/users?id=1', expect.objectContaining({ redirect: 'error' }));
  });

  it('路径逃逸时不应发起请求', async () => {
    const result = await safeFetchRemoteData('/../admin', { method: 'GET', headers: {} }, {
      setJsonByRemote: { enable: true, target: 'https://api.example.com/v1' },
    } as MihawkOptions);

    expect(result).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
