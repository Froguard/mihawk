'use strict';
import Colors from 'color-cc';
import deepmerge from 'deepmerge';
import * as chokidar from 'chokidar';
import { Printer } from '../../src/utils/print';
import { getRcData } from '../../src/composites/rc';
import { DEFAULT_RC, PKG_NAME } from '../../src/consts';
import mihawk from '../../src/index';
import { createWatcher } from '../../src/composites/watcher';
import { processExit } from '../../src/utils/process';
import { sleep, throttleAsync } from '../../src/utils/async';
import { getRoutesFileExt } from '../../src/utils/path';
import type { SubCmdCallback, MihawkRC, Loosify } from '../../src/com-types';

type ServerCtrl = Awaited<ReturnType<typeof mihawk>>;
interface Controller {
  watcher?: chokidar.FSWatcher | null;
  serverHandle?: ServerCtrl | null;
}
/**
 * mihawk main
 */
const callback: SubCmdCallback<Loosify<MihawkRC>> = async function start(args) {
  // Printer.log('CliConfig:', args);
  const rootConfig = await getRcData<MihawkRC>(`.${PKG_NAME}rc`, { initConfig: { ...DEFAULT_RC } });
  // Printer.log('RootConfig:', rootConfig);
  const finalConfig = deepmerge<Loosify<MihawkRC>>(rootConfig || {}, args);
  // Printer.log('FinalConfig:', finalConfig);
  //
  const controller: Controller = { watcher: null, serverHandle: null };
  // 1.start a mock server
  await _start(controller, finalConfig);

  // 2.create watcher if needed (config.watch=true)
  if (finalConfig.watch) {
    setTimeout(() => {
      const reload = throttleAsync(_restart, 500);
      controller.watcher = createWatcher(finalConfig, (eventName: string, ...args: any[]) => {
        // 除开文件夹的操作（新增，删除），其他都需要进行检查
        if (!['addDir', 'unlinkDir'].includes(eventName)) {
          const [filePath, newFilePath] = args || [];
          // 1.对于 js,cjs,ts 等代码的更改，不仅仅会需要刷新模块，还需让server重启（以便于重新执行加载逻辑，载入最新模块）
          const isLogicFile = _isLogicFile(filePath);
          // 2.对于 routes 文件，即便它可能是 json|json5, 也需要刷新 server 程序
          const isRoutesFile = filePath.endsWith(`routes.${getRoutesFileExt(finalConfig.mockLogicFileType)}`);
          // 3.对于 rename 的事件，参数除了 filePath 外，还有一个 newFilePath （即改名字：filePath -> newFilePath ）
          const isNewLigicFile = newFilePath && _isLogicFile(newFilePath);
          // 综上三种情况，决定是否需要重启服务
          const needReload = isLogicFile || isRoutesFile || isNewLigicFile;
          needReload && reload(controller, finalConfig);
        }
      });
    }, 0);
  }
};

//
//
// ============================================================ private functions ============================================================
//
//

/**
 * 判断文件是否为逻辑文件
 * - 通过文件路径中的文件名判断
 * - 后缀是否为 .js, .cjs, .ts 三者之一
 * @param filePath
 * @returns
 */
function _isLogicFile(filePath: string) {
  return filePath && ['.js', '.cjs', '.ts'].some(ext => filePath.endsWith(ext));
}

/**
 * main logic, run mock server
 * @param ctrl
 * @param config
 */
async function _start(ctrl: Controller, config: Loosify<MihawkRC>, isRestart?: boolean) {
  // start server
  try {
    //
    // run main logic
    ctrl.serverHandle = await mihawk(config, isRestart);
    //
    //
  } catch (error) {
    Printer.error('Occurs error during runing async-function mihawk(config):\n', error);
    Printer.warn('Please check your config or try to run it again.');
    // stop watcher
    if (typeof ctrl.watcher?.close === 'function') {
      Printer.log('Will close file watcher...');
      try {
        await ctrl.watcher.close();
      } catch (error) {
        Printer.warn('Error occurs during close watcher:', error);
      }
    }
    // destroy server
    if (typeof ctrl.serverHandle?.destory === 'function') {
      Printer.log('Will destory server...');
      try {
        await ctrl.serverHandle?.destory();
      } catch (error) {
        Printer.warn('Error occurs during destory server:', error);
      }
    }
    Printer.warn(Colors.yellow('Will exit process...'));
    // exit process
    processExit(1);
  }
}

/**
 * restart mock server
 * @param ctrl
 * @param config
 */
async function _restart(ctrl: Controller, config: Loosify<MihawkRC>) {
  if (typeof ctrl.serverHandle?.close === 'function') {
    console.log();
    Printer.log(`🔄 ${Colors.magenta('Will restart the Mock-Tool...')}`);
    // close current one
    await ctrl.serverHandle?.close();
    // wait a while, mak sure server is closed!
    await sleep(0);
    // start main again
    Printer.log(Colors.gray('🔜 The Mock-Tool is ready to lanuch...'));
    await _start(ctrl, config, true);
    //
  }
}

//
export default callback;
