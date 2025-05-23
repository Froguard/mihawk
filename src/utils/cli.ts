'use strict';
import prompts from 'prompts';
import minimist from 'minimist';
import { Printer, Debugger } from './print';
import type { CliArgs } from '../com-types';

//
interface GetCliArgsOptions {
  logDetail?: boolean; // 是否打印日志
}
/**
 * 获取命令行参数，并解析成对象返回
 * @param {string[]} processArgv
 * @param {GetCliArgsOptions} options
 * @returns {Loosify<T>} 返回参数对象
 */
export function getCliArgs<T extends Record<string, any> = any>(processArgv: string[] = process.argv, options?: GetCliArgsOptions): CliArgs<T> {
  const { logDetail = false } = options || {};
  if (!processArgv?.length) {
    processArgv = process.argv || [];
  }
  /**
   * 解释：为什么从 2 开始 slice？
   * process.argv[0] 都是 node 的路径，process.argv[1] 是当前文件路径。包含以下的情况：
   * - 情况1：通过 node 执行 js 主文件（或者 ts-node 执行 ts 主文件）
   * - 情况2：通过命令行直接调用执行某个指令
   * - 情况3：通过 yarn 或 npm 执行 package.json 中的 scripts
   *
   * 比如，执行 "node ./xxx/index.js -a --hello=1 m111 m222" 指令，在 ./xxx/index.js 文件中，对 process.argv 进行打印，将会得到如下打印信息
   * [
   *   '/some_path_to_node/Nodejs/node.exe', // nodejs 执行程序所在路径（MacOS 和 windows 的路径不同）
   *   '/your_project_path/xxx/index.js', // 你的执行文件路径
   *   '-a',
   *   '--hello=1',
   *   'm111',
   *   'm222',
   * ]
   *
   * 而 minimist(processArgv.slice(2)) 会将上述的原始参数解析成如下对象
   * {
   *   _: [ 'm111', 'm222' ], // 属性 _ 存储所有的非参数型输入
   *   a: true, // 剩下的参数型输入，如缩写 -a，全写 --hello，均会额外作为时间参数字段保留
   *   hello: 1,
   * }
   *
   * 值得注意的是，对于空参数 -- 这种，process.argv 数组中不会出现，所以 minimist 解析之后，也不会出现 -- 参数。而且也不推荐这种写法
   * warning From Yarn 1.0 onwards, scripts don't require "--" for options to be forwarded. In a future version, any explicit "--" will be forwarded as-is to the scripts.
   */
  const res = minimist(processArgv.slice(2));
  if (logDetail) {
    Printer.log('[getCliArgs] processArgv:', processArgv);
    Printer.log('[getCliArgs] return:', res);
  }
  return res as CliArgs<T>;
}

/**
 * 命令行交互：确认提示
 * @param {string} question 问题文案
 * @returns {Promise<boolean>} 默认确认？
 * @example
 * (async()=>{
 *   const ok = await confirmInCLI('Are you sure?', true);
 *   console.log(ok ? 'YES' : 'NO');
 * })
 */
export async function confirmInCLI(question: string, defaultYes?: boolean) {
  const { sure = false } = await prompts({
    type: 'toggle', // 'confirm'
    name: 'sure', // 返回的字段名称命名
    initial: defaultYes,
    active: 'yes',
    inactive: 'no',
    message: question || 'Are you sure?',
  });
  return sure as boolean;
}

/**
 * 命令行交互：输入文字
 * @param {string} promptTxt
 */
export async function inputTxtInCLI(promptTxt: string, initial?: string) {
  const { txt } = await prompts({
    type: 'text',
    name: 'txt',
    message: promptTxt || 'Input your text:',
    initial,
  });
  return txt as string;
}

/**
 * 命令行交互：输入数字
 * @param {string} promptTxt
 */
export async function inputNumInCLI(promptTxt: string, options?: Partial<{ initial: number; max: number; min: number }>) {
  const { num } = await prompts({
    type: 'number',
    name: 'num',
    message: promptTxt || 'Input your number:',
    ...options,
  });
  return num as number;
}

//
type SelectValue = string | number | boolean | Date;
/**
 * 命令行交互：选择 (优先推荐使用 单选-singleSelectInCli； 多选-multipleSelectInCli；)
 * @param {Array<string>} choices
 */
export async function selectInCli<T extends SelectValue>(promptTxt: string, choices: prompts.Choice[], options?: Partial<{ multiple: boolean; initial: number }>) {
  const { initial, multiple } = options || {};
  const config: prompts.PromptObject<string> = {
    type: multiple ? 'multiselect' : 'select',
    name: 'arr',
    message: promptTxt || `Select ${multiple ? 'some choices' : 'just one choice'}:`,
    choices,
    initial,
  };
  if (multiple) {
    config.hint = '- Space to select. Return to submit';
  }
  const { arr } = await prompts(config);
  return arr as T[] | T;
}

/**
 * 命令行交互：单选
 * @param {Array<string>} choices
 */
export async function singleSelectInCli<T extends SelectValue>(promptTxt: string, choices: prompts.Choice[], initial?: number) {
  const res = await selectInCli<T>(promptTxt, choices, { multiple: false, initial });
  return res as T;
}

/**
 * 命令行交互：多选
 * @param {Array<string>} choices
 */
export async function multipleSelectInCli<T extends SelectValue>(promptTxt: string, choices: prompts.Choice[], initial?: number) {
  const res = await selectInCli<T>(promptTxt, choices, { multiple: true, initial });
  return res as T[];
}
