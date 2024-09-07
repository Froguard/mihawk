'use strict';
import Colors from 'color-cc';
import deepmerge from 'deepmerge';
import * as chokidar from 'chokidar';
import { Debugger, Printer } from '../../src/utils/print';
import { getRcData } from '../../src/composites/rc';
import { PKG_NAME } from '../../src/consts';
import mihawk from '../../src/index';
import { absifyPath, getLogicFileExt, relPathToCWD } from '../../src/utils/path';
import { refreshJson, refreshTsOrJs } from '../../src/composites/loader';
import { isObjStrict } from '../../src/utils/is-type';
import type { SubCmdCallback, MihawkRC, Loosify, LoigicFileExt } from '../../src/com-types';

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
function refreshModule(filePath: string, allowLogicFileExt: 'js' | 'cjs' | 'ts' | '') {
  if (!filePath) return;
  filePath = absifyPath(filePath);
  const fileRelPath4log = Colors.gray(relPathToCWD(filePath));
  try {
    if (allowLogicFileExt && filePath.endsWith(`.${allowLogicFileExt}`)) {
      refreshTsOrJs(filePath);
      Printer.log(LOGFLAG_WATCHER, `${Colors.success('Refresh script module!')} ${fileRelPath4log}`);
      //
    } else if (filePath.endsWith('.json') || filePath.endsWith('.json5')) {
      refreshJson(filePath);
      Printer.log(LOGFLAG_WATCHER, `${Colors.success('Refresh json module!')} ${fileRelPath4log}`);
      //
    } else {
      Printer.log(LOGFLAG_WATCHER, `${Colors.fail('Skip refresh module, file type:')} ${fileRelPath4log}`);
    }
    //
  } catch (error) {
    Printer.error(LOGFLAG_WATCHER, `${Colors.fail('Refresh module failed!')} ${fileRelPath4log}\n`, error);
  }
}

/**
 * mihawk main
 */
const callback: SubCmdCallback<Loosify<MihawkRC>> = async function start(args) {
  Debugger.log('CliConfig:', args);
  const rootConfig = await getRcData<MihawkRC>(`.${PKG_NAME}rc`);
  Debugger.log('RootConfig:', rootConfig);
  const finalConfig = deepmerge<Loosify<MihawkRC>>(rootConfig, args);
  Debugger.log('FinalConfig:', finalConfig);
  //
  // 文件夹监控，检测到文件变化，刷新文件缓存（js|cjs|ts|json|json5）
  let watcher: chokidar.FSWatcher | null = null;
  const { watch, mockLogicFileType } = finalConfig;
  if (watch) {
    setTimeout(() => {
      const watchTargetPath = absifyPath(finalConfig.mockDir);
      const logicFileExt = getLogicFileExt(mockLogicFileType);
      watcher = chokidar.watch(watchTargetPath, {
        ignored: WATCHER_IGNORES,
        persistent: true,
      });
      watcher.on('change', filePath => {
        Printer.log(LOGFLAG_WATCHER, 'File has been changed!', Colors.gray(relPathToCWD(filePath)));
        refreshModule(filePath, logicFileExt);
      });
      watcher.on('unlink', filePath => {
        Printer.log(LOGFLAG_WATCHER, 'File has been deleted!', Colors.gray(relPathToCWD(filePath)));
        refreshModule(filePath, logicFileExt);
      });
      watcher.on('rename', (oldFilePath, newFilePath) => {
        Printer.log(LOGFLAG_WATCHER, 'File has been rename!', `${Colors.gray(relPathToCWD(oldFilePath))} -> ${Colors.gray(relPathToCWD(newFilePath))}`);
        refreshModule(oldFilePath, logicFileExt);
        refreshModule(newFilePath, logicFileExt);
      });
      Printer.log(
        LOGFLAG_WATCHER,
        Colors.success('Enable watcher, start watching mock files...'), //
        Colors.gray(`./${finalConfig.mockDir}/**/*.{json|json5${logicFileExt ? `|${logicFileExt}` : ''}}`),
      );
    }, 0);
  }
  //
  try {
    //
    await mihawk(finalConfig);
    //
  } catch (error) {
    // stop watcher
    if (isObjStrict(watcher) && typeof watcher?.close === 'function') {
      watcher.close();
    }
    // print log
    Printer.error('Occurs error during runing async-function mihawk(config):', error);
    Printer.warn('Please check your config or try again.');
    Printer.log('Will exiit process...');
    console.log();
    process.exit(1);
  }
};

//
export default callback;
