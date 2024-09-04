#!/usr/bin/env node

/**
 * cli: mihawk
 */
import Colors from 'color-cc';
import { LOG_FLAG } from '../src/consts';
import { getCliArgs } from '../src/utils/cli';
import { readPackageJson } from '../src/composites/loader';
import { Printer, Debugger } from '../src/utils/print';
import init from './sub-cmds/init';
import type { SubCmdCallback } from '../src/com-types';

//
const { name, version } = readPackageJson() || {};

/**
 * main logic
 */
(async () => {
  const args = getCliArgs();
  const { _, v, V, version, h, H, help } = args;
  //
  if (v || V || version) {
    showVersion(); // mihawk -v
  } else if (h || H || help) {
    showHelp(); // mihawk -h
  } else {
    let callback: null | SubCmdCallback<any> = null;
    const subCmdName = _?.[0]?.trim() || ''; // find sub cmd callback
    switch (subCmdName) {
      case 'init':
      case 'initial':
        callback = init; // mihawk init
        break;
      default: // others
        break;
    }
    if (typeof callback === 'function') {
      const newArgs = { ...args, _: _?.slice(1) || [] };
      Printer.log(Colors.gray(`mihawk ${subCmdName}`), Colors.gray(newArgs._.join(' ')));
      try {
        await callback(newArgs); // exec sub cmd
      } catch (error) {
        Printer.log(Colors.yellow('Oops... It looks like something wrong:'), error, '\n');
        showHelp();
        process.exit(1); // quit
      }
    } else {
      Debugger.log(`${LOG_FLAG} process.argv=`, process.argv);
      Debugger.log(`${LOG_FLAG} args=`, args);
      showPkgInfo();
      showHelp();
    }
    //
  }
})();
//

//
//
// ============================================= functions ===================================================
//
//

/**
 * 显示包信息
 */
function showPkgInfo() {
  Printer.log(`${name}@${version}\n`);
}

/**
 * 显示帮助信息
 */
function showHelp() {
  console.log(
    [
      '',
      `Usage: ${name} [options]`,
      'Options:',
      '  -v, -V, --version  Show version information', //
      '  -h, -H, --help     Display help for command',
      '\n',
    ].join('\n'),
  );
}

/**
 * 显示版本信息
 */
function showVersion() {
  console.log(`v${version}\n`);
}
