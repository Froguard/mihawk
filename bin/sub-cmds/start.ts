'use strict';
import deepmerge from 'deepmerge';
import { Debugger, Printer } from '../../src/utils/print';
import { getRcData } from '../../src/utils/rc';
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
  try {
    await mihawk(finalConfig);
  } catch (error) {
    Printer.error('Exec function mihawk(config) occurs error:', error);
    Printer.warn('Please check your config or try again.');
    Printer.log('Will exiit process...');
    process.exit(1);
  }
};

//
export default callback;
