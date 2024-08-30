/**
 * 解决打包产物中，多余的肯定不会被用上的bin文件目录
 * 本工程中，对于 bin 的配置，固定写死为 dist/cjs/bin, 而对于 dist/esm/bin 和 dist/types/bin 这两个文件并未使用，需要删除
 */
'use strict';
import path from 'path';
import Colors from 'color-cc';
import { removeSync } from 'fs-extra';

const LOG_FLAG = `${Colors.magenta('[post-build]')} ${Colors.gray('deleteDistUselessBins:')}:`;
const ROOT_DIR = path.resolve(__dirname, '../../');

/**
 * 删除 dist/esm/bin 和 dist/types/bin 这两个文件夹
 */
export default function deleteDistUselessBins() {
  console.log(LOG_FLAG, '删除 dist/esm/bin 和 dist/types/bin 这两个文件夹...');
  //
  const binDirs = ['./dist/esm/bin', './dist/types/bin'].map(d => path.resolve(ROOT_DIR, d));
  binDirs.forEach(dir => removeSync(dir));
}
