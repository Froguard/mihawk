#!/usr/bin/env node

/**
 * cli: mihawk
 */
import Colors from 'color-cc';
import { LOG_FLAG } from '../src/consts';
import { getCliArgs } from '../src/utils/cli-tool';
import { pkgInfo, type SubCmdCallback } from './com';
import init from './sub-cmds/init';

//
const { name, version } = pkgInfo || {};

/**
 * main logic
 */
(async () => {
  const args = getCliArgs();
  const { _, v, V, version, h, H, help } = args;
  //
  if (v || V || version) {
    // mihawk -v
    showVersion();
    //
  } else if (h || H || help) {
    // mihawk -h
    showHelp();
    //
  } else {
    // mihawk $subCmd
    let callback: null | SubCmdCallback<any> = null;
    // find sub cmd callback
    const subCmdName = _[0] || '';
    switch (subCmdName) {
      // mihawk init
      case 'init':
      case 'initial':
        callback = autoTest;
        break;
      // mihawk
      default:
        break;
    }
    if (typeof callback === 'function') {
      const newArgs = { ...args, _: _?.slice(1) || [] };
      // exec sub cmd
      console.log(LOG_FLAG, `mihawk ${subCmdName}`, Colors.gray(newArgs._.join(' ')));
      try {
        await callback?.(newArgs);
      } catch (error) {
        console.log(LOG_FLAG, Colors.yellow('Oops... It looks like something wrong:'), error, '\n');
        showHelp();
        process.exit(1); // quit
      }
    } else {
      console.log(`${LOG_FLAG} process.argv=`, process.argv);
      console.log(`${LOG_FLAG} args=`, args);
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
  const { name: name, version: version } = pkgInfo || {};
  console.log(LOG_FLAG, `${name}@${version}\n`);
}

/**
 * 显示帮助信息
 */
function showHelp() {
  console.log(['', `Usage: ${name} [options]`, 'Options:', '  -v, -V, --version  Show version information', '  -h, -H, --help     Display help for command', '\n'].join('\n'));
}

/**
 * 显示版本信息
 */
function showVersion() {
  console.log(`v${version}\n`);
}
