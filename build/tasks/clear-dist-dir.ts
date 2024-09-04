/**
 * 清空 dist 目录，但保留 dist/.gitkeep 文件
 */
'use strict';
import path from 'path';
import Colors from 'color-cc';
import { removeSync, readdirSync } from 'fs-extra';

const LOG_PREFIX = `${Colors.magenta('[pre-build]')} ${Colors.gray('clearDistDir:')}`;
const ROOT_DIR = path.resolve(__dirname, '../../');

/**
 * 清空 dist 目录(保留 dist/.gitkeep)
 * 相当于 find dist -mindepth 1 -not -name '.gitkeep' -exec rm -rf {} +
 */
export default function clearDistDir() {
  console.log(LOG_PREFIX, `清空 dist 目录下所有文件${Colors.gray('（保留 dist/.gitkeep）')}...`);
  //
  const distDir = path.resolve(ROOT_DIR, './dist');
  const distFiles = readdirSync(distDir);
  distFiles.forEach(fileName => fileName !== '.gitkeep' && removeSync(path.resolve(distDir, fileName)));
}
