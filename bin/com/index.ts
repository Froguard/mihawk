/**
 * bin 目录下公共逻辑
 */
import packageJson from '../../package.json';
import type { IPackageJson } from 'package-json-type';
import type { CliArgs } from '../../src/utils/cli-tool';

/**
 * subCmd 主逻辑对应的回调函数
 */
export type SubCmdCallback<T = any> = (cliArg?: CliArgs<T>) => Promise<void>;

/**
 * package.json 内容对象
 */
export const pkgInfo = (packageJson || {}) as IPackageJson;
