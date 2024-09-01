'use strict';
import type { ParsedArgs } from 'minimist';

/**
 * koa 类型
 */
export type {
  Middleware as KoaMiddleware, // async (ctx: Koa.Context, next: Koa.Next) => void
  Context as KoaContext, // Koa.Context
  Next as KoaNext, // Koa.Next
  Request as KoaRequest, // Koa.Request
  Response as KoaResponse, // Koa.Response
} from 'koa';
// koa-bodyparser options
export type { Options as KoaBodyParserOptions } from 'koa-bodyparser';

export interface HttpsConfig {
  key: string;
  cert: string;
}

/**
 * mihawk options
 */
export interface MihawkOptions {
  /**
   * 监听地址，默认 `0.0.0.0`
   */
  host?: string;

  /**
   * 监听端口, 默认 8888
   */
  port?: number;

  /**
   * 是否开启 https，默认 false
   */
  https?: boolean | HttpsConfig;

  /**
   * 是否开启 cors，默认 true
   */
  cors?: boolean;

  /**
   * mock 目录，默认为 `./mocks`
   */
  mockDir?: string;

  /**
   * 是否开启 watch（mock 文件变化的时候，进行刷新），默认 true
   */
  watch?: boolean;

  /**
   * 对 mock 文件进行缓存，默认 true
   */
  cache?: boolean;

  /**
   * 是否自动创建 mock 文件，默认 false
   */
  autoCreateMockFile?: boolean;

  /**
   * mock 逻辑文件类型，默认 js|cjs
   */
  mockLogicFileType?: 'none' | 'js' | 'cjs' | 'javascript' | 'ts' | 'typescript';

  /**
   * tsconfig.json 的路径
   * - 当且仅当 mockLogicFileType 为 ts|typescript 时有效
   * - 默认不写则为空字符串，即采用内置的 ts 配置
   *   - 可以写为 `./mocks/tsconfig.json`(建议和工程中的 tsconfig.json 区分开来，因为 mockTs 并不需要进行打包输出)
   */
  tsconfigPath?: string;

  /**
   * mock 数据文件类型，默认 json
   */
  mockDataFileType?: 'json' | 'json5';

  /**
   * 日志打印，配置项
   */
  logConfig?: {
    /**
     * 指定路由对应日志忽略不打印
     */
    ignoreRoutes?: string[];
  };
}

/**
 * mihawk root-config 配置文件
 */
export interface MihawkRC extends MihawkOptions {}

/**
 * cli 命令行参数
 */
export type CliArgs<T extends Record<string, any> = any> = Loosify<ParsedArgs & T>;

/**
 * subCmd 主逻辑对应的回调函数
 */
export type SubCmdCallback<T = any> = (cliArg?: CliArgs<T>) => Promise<void>;

/**
 * JSON 对象属性的 value 常规定义
 */
export type JSONValue = null | boolean | number | string | JSONValue[] | { [key: string]: JSONValue };

/**
 * JSON 对象常规定义
 */
export type JSONObject = Record<string | number, JSONValue>;

/**
 * 让对象 T 中的子属性变成“宽松”(可选&可自定义)
 * - 1.子属性可选的
 * - 2.子属性可自定义，即 { [k: string | number | symbol]: any }
 *
 * 可用于“一些对象可能长得像某个类型时，但子属性又不局限于这个类型定义”的场景
 */
export type Loosify<T> = Partial<T> & Record<string | number | symbol, any>;
