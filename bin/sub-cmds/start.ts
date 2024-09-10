'use strict';
import Colors from 'color-cc';
import deepmerge from 'deepmerge';
import * as chokidar from 'chokidar';
import { Debugger, Printer } from '../../src/utils/print';
import { getRcData } from '../../src/composites/rc';
import { DEFAULT_RC, PKG_NAME } from '../../src/consts';
import mihawk from '../../src/index';
import { createWatcher } from '../../src/composites/watcher';
import { processExit } from '../../src/utils/process';
import type { SubCmdCallback, MihawkRC, Loosify } from '../../src/com-types';

/**
 * mihawk main
 */
const callback: SubCmdCallback<Loosify<MihawkRC>> = async function start(args) {
  Debugger.log('CliConfig:', args);
  const rootConfig = await getRcData<MihawkRC>(`.${PKG_NAME}rc`, { initConfig: { ...DEFAULT_RC } });
  Debugger.log('RootConfig:', rootConfig);
  const finalConfig = deepmerge<Loosify<MihawkRC>>(rootConfig || {}, args);
  Debugger.log('FinalConfig:', finalConfig);
  //
  // create watcher if needed (config.cache=true)
  let watcher: chokidar.FSWatcher | null = null;
  finalConfig.watch &&
    setTimeout(() => {
      watcher = createWatcher(finalConfig);
    }, 0);
  //
  let serverHandle: Awaited<ReturnType<typeof mihawk>> | null = null;
  try {
    //
    // run main logic
    serverHandle = await mihawk(finalConfig);
    //
    //
  } catch (error) {
    Printer.error('Occurs error during runing async-function mihawk(config):', error);
    Printer.warn('Please check your config or try to run it again.');
    // stop watcher
    if (typeof watcher?.close === 'function') {
      Printer.log('Will close file watcher...');
      try {
        await watcher.close();
      } catch (error) {
        Printer.warn('Error occurs during close watcher:', error);
      }
    }
    // destroy server
    if (typeof serverHandle?.destory === 'function') {
      Printer.log('Will destory server...');
      try {
        await serverHandle.destory();
      } catch (error) {
        Printer.warn('Error occurs during destory server:', error);
      }
    }
    Printer.warn(Colors.yellow('Will exit process...'));
    // exit process
    processExit(1);
  }
};

//
export default callback;
