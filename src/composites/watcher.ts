'use strict';
import Colors from 'color-cc';
import * as chokidar from 'chokidar';
import { Printer } from '../../src/utils/print';
import { absifyPath, getLogicFileExt, relPathToCWD } from '../../src/utils/path';
import { refreshJson, refreshTsOrJs } from '../../src/composites/loader';
import type { MihawkRC, Loosify } from '../../src/com-types';

const WATCHER_IGNORES = [
  // hidden files
  '**/.*',
  // markdown files
  '**/*.md',
  // third part packages
  '**/node_modules/**',
  '**/.DS_Store',
  // version controll
  '**/.git/**',
  '**/.gitkeep',
  '**/.gitignore',
  '**/.svn/**',
  // tsconfig
  '**/tsconfig.json',
  '**/tsconfig.*.json',
  // // build output files:
  // '**/dist/**',
  // '**/build/**',
  // '**/output/**',
  // // test files:
  // '**/test/**',
  // '**/_test_/**',
  // '**/__test__/**',
  // '**/tests/**',
  // '**/_tests_/**',
  // '**/__tests__/**',
  // '**/coverage/**',
  // '**/_coverage_/**',
  // '**/__coverage___/**',
  // temp files:
  // '**/tmp/**',
  // '**/tmp-*',
  // '**/temp/**',
  // '**/temp-*',
];
const LOGFLAG_WATCHER = `${Colors.cyan('[watcher]')}${Colors.gray(':')}`;

/**
 * 刷新模块的 require cache
 * @param {string} filePath 需要被刷新的模块的绝对路径
 */
export function refreshModule(filePath: string, allowLogicFileExt: 'js' | 'cjs' | 'ts' | '') {
  if (!filePath) return;
  filePath = absifyPath(filePath);
  const fileRelPath4log = Colors.gray(relPathToCWD(filePath));
  try {
    if (allowLogicFileExt && filePath.endsWith(`.${allowLogicFileExt}`)) {
      refreshTsOrJs(filePath);
      Printer.log(LOGFLAG_WATCHER, Colors.success('Refresh script module!'), fileRelPath4log);
      //
    } else if (filePath.endsWith('.json') || filePath.endsWith('.json5')) {
      refreshJson(filePath);
      Printer.log(LOGFLAG_WATCHER, Colors.success('Refresh json module!'), fileRelPath4log);
      //
    } else {
      Printer.log(LOGFLAG_WATCHER, Colors.gray('Skip refresh unnecessary module!'), fileRelPath4log);
    }
    //
  } catch (error) {
    Printer.error(LOGFLAG_WATCHER, Colors.fail('Refresh module failed!'), fileRelPath4log, '\n', error, '\n');
  }
}

/**
 * 初始化一个文件监听器（）
 * @param {Loosify<MihawkRC>} config
 * @returns {chokidar.FSWatcher} watcher
 */
export function createWatcher(config: Loosify<MihawkRC>) {
  const { mockDir, mockLogicFileType } = config;
  const watchTargetPath = absifyPath(mockDir);
  const logicFileExt = getLogicFileExt(mockLogicFileType);
  // create a watcher
  const watcher = chokidar.watch(watchTargetPath, {
    ignored: WATCHER_IGNORES,
    persistent: true,
  });
  // listen file's change event
  watcher.on('change', filePath => {
    Printer.log(LOGFLAG_WATCHER, 'File has been changed!', Colors.gray(relPathToCWD(filePath)));
    refreshModule(filePath, logicFileExt);
  });
  // listen file's unlink event
  watcher.on('unlink', filePath => {
    Printer.log(LOGFLAG_WATCHER, 'File has been deleted!', Colors.gray(relPathToCWD(filePath)));
    refreshModule(filePath, logicFileExt);
  });
  // listen file's rename event
  watcher.on('rename', (oldFilePath, newFilePath) => {
    Printer.log(LOGFLAG_WATCHER, 'File has been rename!', `${Colors.gray(relPathToCWD(oldFilePath))} -> ${Colors.gray(relPathToCWD(newFilePath))}`);
    refreshModule(oldFilePath, logicFileExt);
    refreshModule(newFilePath, logicFileExt);
  });
  // log
  process.nextTick(() =>
    Printer.log(
      LOGFLAG_WATCHER,
      Colors.success('Enable watcher, start watching mock files...'), //
      Colors.gray(`./${mockDir}/**/*.{json|json5${logicFileExt ? `|${logicFileExt}` : ''}}`),
    ),
  );
  return watcher;
}