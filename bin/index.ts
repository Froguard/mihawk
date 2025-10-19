#!/usr/bin/env node

/**
 * cli: mihawk
 */
import Colors from 'color-cc';
import { getCliArgs } from '../src/utils/cli';
import { readPackageJson } from '../src/composites/loader';
import { Printer } from '../src/utils/print';
import init from './sub-cmds/init';
import start from './sub-cmds/start';
import type { SubCmdCallback } from '../src/com-types';

//
const { name: pkgName, version: pkgVersion } = readPackageJson() || {};

/**
 * main logic
 */
(async () => {
  const args = getCliArgs();
  const { _, v, V, ver, version, h, H, help } = args;
  //
  if (v || V || ver || version) {
    // mihawk -v
    showVersion();
  } else if (h || H || help) {
    // mihawk -h
    showHelp();
  } else {
    const subCmdName = _?.[0]?.trim() || '';
    const isMainCmd = !subCmdName;
    if (isMainCmd) {
      // main cmd: mihawk -a -b -c -d ...
      Printer.log(Colors.gray(`mihawk ${_.length ? _.join(' ') : ''}`));
      try {
        await start(args);
      } catch (error) {
        errorHandler(error);
      }
    } else {
      // sub cmd: mihawk <sub-cmd> -a -b -c -d ...
      let callback: null | SubCmdCallback<any> = null;
      switch (subCmdName) {
        case 'i':
        case 'init':
        case 'initial':
          callback = init; // mihawk init
          break;
        default: // mihawk unknown
          break;
      }
      // detect sub cmd callback & exec it, if it existed
      if (typeof callback === 'function') {
        const newArgs = { ...args, _: _?.slice(1) || [] };
        Printer.log(Colors.gray(`mihawk ${subCmdName}`), Colors.gray(newArgs._.join(' ')));
        try {
          await callback(newArgs); // exec sub cmd
        } catch (error) {
          errorHandler(error);
        }
      } else {
        // Printer.log('process.argv=', process.argv, 'args=', args);
        showPkgInfo();
        showHelp();
        process.exit(1); // quit
      }
    }
  }
})();
//

//
//
// ============================================= functions ===================================================
//
//

function errorHandler(error: any) {
  Printer.log(Colors.yellow('Oops... It looks like something went wrong:'), error, '\n');
  showHelp();
  process.exit(1); // quit
}

/**
 * 显示包信息
 */
function showPkgInfo() {
  Printer.log(`${pkgName}@${pkgVersion}\n`);
}

/**
 * 显示帮助信息
 */
function showHelp() {
  console.log(
    [
      '',
      `Usage: ${pkgName} [options]`,
      'Options:',
      '  -v, -V, --ver --version   Show version information', //
      '  -h, -H, --help            Display help for command',
      `  -p, --port ${Colors.gray('<number>')}       Specify the port number(1024-10000)`,
      `  -d, --mockDir ${Colors.gray('<string>')}    Specify the mock data directory(non-empty-string)`,
      `  -w, --watch ${Colors.gray('<boolean>')}     Enable watch mode`,
      'Examples:',
      Colors.gray(`  > ${pkgName} -p 8888 -d ./mocks`),
      Colors.green('Recommended:'),
      `  1. init a ${Colors.gray(`.${pkgName}rc.json`)} file`,
      Colors.gray(`  > ${pkgName} init`),
      `  2. then start mihawk server directly`,
      Colors.gray(`  > ${pkgName}`),
      '\n',
    ].join('\n'),
  );
}

/**
 * 显示版本信息
 */
function showVersion() {
  console.log(`v${pkgVersion}\n`);
}
