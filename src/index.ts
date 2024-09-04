'use strict';
import path from 'path';
import Koa from 'koa';
import Colors from 'color-cc';
import { Printer, Debugger } from './utils/print';
import { formatOptionsByConfig } from './utils/rc';
import type { Loosify, MihawkRC } from './com-types';

/**
 * mihawk
 * @param {Loosify<MihawkRC>} config
 */
export default async function mihawk(config?: Loosify<MihawkRC>) {
  Debugger.log('init config:', config);
  const options = formatOptionsByConfig(config);
  Printer.log('options:', options);
  //
}
