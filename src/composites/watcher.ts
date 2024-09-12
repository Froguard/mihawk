'use strict';
import Colors from 'color-cc';
import * as chokidar from 'chokidar';
import { Printer } from '../../src/utils/print';
import { absifyPath, getLogicFileExt, relPathToCWD } from '../../src/utils/path';
import { refreshJson, refreshTsOrJs } from '../../src/composites/loader';
import { LOG_ARROW } from '../consts';
import type { MihawkRC, Loosify } from '../../src/com-types';

/**
 * 监控需要默认忽略的文件/文件夹路径
 */
const WATCHER_IGNORES = [
  // hidden dot files
  '**/.*',
  // dot files
  '**/.DS_Store',
  // markdown
  '**/*.md',
  // txt
  '**/*.txt',
  // media files
  '**/*.{jpg,jpeg,png,gif,bmp,webp,svg}', // image files
  '**/*.{mp4,mpeg,mpg,avi,mov,flv,wmv,rmvb,mkv}', // video files
  '**/*.{wav,mp3,ogg,aac,flac,wma,m4a}', // audio files
  // office files
  '**/*.{doc,docx,ppt,pptx,xls,xlsx,pdf}', // MS office files
  '**/*.{pages,page,pagelet,pagelets,key,numbers}', // MacOS office files
  // tsconfig
  '**/tsconfig.json',
  '**/tsconfig.*.json',
  // third part packages
  '**/node_modules/**',
  '**/bower_components/**',
  // IDE config
  '**/.idea/**',
  '**/.vscode/**',
  // version controll
  '**/.git/**',
  '**/.gitkeep',
  '**/.gitignore',
  '**/.svn/**',
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
    Printer.error(LOGFLAG_WATCHER, Colors.fail('Refresh module failed!'), fileRelPath4log, '\n', error);
  }
}

// 可监控的事件范围
export type WatchEventType = 'add' | 'addDir' | 'change' | 'unlink' | 'unlinkDir';

/**
 * 初始化一个文件监听器（）
 * @param {Loosify<MihawkRC>} config
 * @returns {chokidar.FSWatcher} watcher
 */
export function createWatcher(config: Loosify<MihawkRC>, callback?: (eventName: string | WatchEventType, ...args: any[]) => any) {
  const { mockDir, mockLogicFileType } = config;
  const watchTargetPath = absifyPath(mockDir);
  const logicFileExt = getLogicFileExt(mockLogicFileType);
  // create a watcher
  const watcher = chokidar.watch(watchTargetPath, {
    ignored: WATCHER_IGNORES,
    persistent: true,
    ignoreInitial: true,
  });
  const cb = typeof callback === 'function' ? callback : () => {};
  // addEventListeners
  watcher.on('all', (eventName: string | WatchEventType, filePath) => {
    if (eventName === 'rename') {
      return;
    }
    switch (eventName) {
      case 'change': {
        // listen file's change event
        console.log();
        Printer.log(LOGFLAG_WATCHER, 'File has been changed!', Colors.gray(relPathToCWD(filePath)));
        refreshModule(filePath, logicFileExt);
        break;
      }
      case 'unlink': {
        // listen file's unlink event
        console.log();
        Printer.log(LOGFLAG_WATCHER, 'File has been deleted!', Colors.gray(relPathToCWD(filePath)));
        refreshModule(filePath, logicFileExt);
        break;
      }
      case 'unlinkDir': // listen dir's unlink event
      case 'add': // listen file's add event
      case 'addDir': // listem dir's add event
      default:
        break;
    }
    //
    cb(eventName, filePath);
  });

  // listen file's rename event
  watcher.on('rename', (oldFilePath, newFilePath) => {
    console.log();
    Printer.log(LOGFLAG_WATCHER, 'File has been rename!', `${Colors.gray(relPathToCWD(oldFilePath))} ${LOG_ARROW} ${Colors.gray(relPathToCWD(newFilePath))}`);
    refreshModule(oldFilePath, logicFileExt);
    refreshModule(newFilePath, logicFileExt);
    cb('rename', oldFilePath, newFilePath);
  });

  //
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
