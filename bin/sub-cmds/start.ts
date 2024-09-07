'use strict';
import deepmerge from 'deepmerge';
import { Debugger, Printer } from '../../src/utils/print';
import { getRcData } from '../../src/composites/rc';
import { PKG_NAME } from '../../src/consts';
import mihawk from '../../src/index';
import type { SubCmdCallback, MihawkRC, Loosify } from '../../src/com-types';

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
  // TODO: 实现文件监控，检测到文件变化，刷新文件缓存（js|cjs|ts|json|json5）

  //
  try {
    //
    await mihawk(finalConfig);
    //
  } catch (error) {
    Printer.error('Occurs error during runing async-function mihawk(config):', error);
    Printer.warn('Please check your config or try again.');
    Printer.log('Will exiit process...');
    console.log();
    process.exit(1);
  }
};

//
export default callback;
