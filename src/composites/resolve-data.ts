import { Printer } from '../utils/print';
import { removeFilePathExt } from '../utils/path';

/**
 * 执行 mock
 * @param mockKey mock 文件路径 (无后缀)
 */
export async function doMock(mockKey: string, mockRoutePath: string) {
  mockKey = removeFilePathExt(mockKey);
  Printer.warn('[doMock]', { mockKey, mockRoutePath });
  // TODO: 待实现
}
