'use strict';
import { existsSync } from 'fs-extra';
import init from '../../../bin/sub-cmds/init';
import { confirmInCLI, inputNumInCLI, inputTxtInCLI, singleSelectInCli } from '../../../src/utils/cli';
import { getRcData, initRCfile } from '../../../src/composites/rc';
import { initMockDataDir, initMockMiddlewareFile, initMockRoutesFile } from '../../../src/composites/init-file';
import { Printer } from '../../../src/utils/print';

jest.mock('fs-extra', () => ({
  ...jest.requireActual('fs-extra'),
  existsSync: jest.fn(),
}));
jest.mock('../../../src/utils/cli', () => ({
  confirmInCLI: jest.fn(),
  inputNumInCLI: jest.fn(),
  inputTxtInCLI: jest.fn(),
  singleSelectInCli: jest.fn(),
}));
jest.mock('../../../src/composites/rc', () => ({
  getRcData: jest.fn(),
  initRCfile: jest.fn(),
}));
jest.mock('../../../src/composites/init-file', () => ({
  initMockDataDir: jest.fn(),
  initMockMiddlewareFile: jest.fn(),
  initMockRoutesFile: jest.fn(),
}));

describe('init 子命令', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => undefined);
    jest.spyOn(Printer, 'log').mockImplementation(() => undefined);
    (existsSync as unknown as jest.Mock).mockReturnValue(false);
    (inputTxtInCLI as jest.Mock).mockResolvedValueOnce('127.0.0.1').mockResolvedValueOnce('./custom-mocks');
    (inputNumInCLI as jest.Mock).mockResolvedValue(9000);
    (confirmInCLI as jest.Mock).mockResolvedValue(false);
    (singleSelectInCli as jest.Mock).mockResolvedValueOnce('json5').mockResolvedValueOnce('none');
    (getRcData as jest.Mock).mockResolvedValue({ mockDir: './custom-mocks', mockLogicFileType: 'none' });
    (initRCfile as jest.Mock).mockResolvedValue(undefined);
    (initMockDataDir as jest.Mock).mockResolvedValue(undefined);
    (initMockRoutesFile as jest.Mock).mockResolvedValue(undefined);
    (initMockMiddlewareFile as jest.Mock).mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('配置不存在时应收集输入并初始化 RC 与 mock 文件', async () => {
    await init();

    expect(initRCfile).toHaveBeenCalledWith(
      '.mihawkrc',
      expect.objectContaining({
        fileType: 'json',
        overwrite: true,
        initConfig: expect.objectContaining({
          host: '127.0.0.1',
          port: 9000,
          mockDir: './custom-mocks',
          mockDataFileType: 'json5',
          mockLogicFileType: 'none',
        }),
      }),
    );
    expect(getRcData).toHaveBeenCalledWith('.mihawkrc');
    expect(initMockDataDir).toHaveBeenCalledWith('./custom-mocks');
    expect(initMockRoutesFile).toHaveBeenCalledWith('none', './custom-mocks');
    expect(initMockMiddlewareFile).toHaveBeenCalledWith('none', './custom-mocks');
  });

  it('RC 文件已存在时应跳过交互初始化但继续补齐 mock 文件', async () => {
    (existsSync as unknown as jest.Mock).mockImplementation((filePath: string) => filePath.endsWith('.mihawkrc.json'));

    await init();

    expect(inputTxtInCLI).not.toHaveBeenCalled();
    expect(initRCfile).not.toHaveBeenCalled();
    expect(initMockDataDir).toHaveBeenCalledWith('./custom-mocks');
    expect(initMockRoutesFile).toHaveBeenCalledWith('none', './custom-mocks');
    expect(initMockMiddlewareFile).toHaveBeenCalledWith('none', './custom-mocks');
  });
});
