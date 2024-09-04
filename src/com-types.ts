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

// koa 扩展
declare module 'koa' {
  interface Context {
    skipDefaultMock?: boolean; // 跳过执行默认的 mock 逻辑
    disableLogPrint?: boolean; // 默认为 false，即打印
    routePath: string; // Method + Path (在 common middleware 中定义)
  }
  interface Request {
    //
  }
  interface Response {
    //
  }
}

/**
 * https 配置
 */
export interface HttpsConfig {
  key: string;
  cert: string;
}

/**
 * mihawk root-config 配置文件
 */
export interface MihawkRC {
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
  https?: false | HttpsConfig;

  /**
   * 是否开启 cors，默认 true
   */
  cors?: boolean;

  /**
   * 是否开启 watch（mock 文件变化的时候，进行刷新），默认 true
   */
  watch?: boolean;

  /**
   * 对 mock 文件进行缓存，默认 true
   */
  cache?: boolean;

  /**
   * mock 目录，默认为 `./mocks`
   */
  mockDir?: string;

  /**
   * mock 数据文件类型，默认 json
   */
  mockDataFileType?: 'json' | 'json5';

  /**
   * mock 逻辑文件类型，默认 js|cjs
   */
  mockLogicFileType?: 'none' | 'js' | 'cjs' | 'javascript' | 'ts' | 'typescript';

  /**
   * 是否自动创建 mock 文件，默认 true
   */
  autoCreateMockLogicFile?: boolean;

  /**
   * tsconfig.json 的路径
   * - 当且仅当 mockLogicFileType 为 ts|typescript 时有效
   * - 默认不写则为空字符串，即采用内置的 ts 配置
   *   - 可以写为 `./mocks/tsconfig.json`(建议和工程中的 tsconfig.json 区分开来，因为 mockTs 并不需要进行打包输出)
   */
  tsconfigPath?: string | null;

  /**
   * 日志打印，配置项
   */
  logConfig?: {
    /**
     * 指定路由对应日志忽略不打印
     */
    ignoreRoutes?: string[];
  } | null;
}

/**
 * Mihawk 启动参数, 在 MihawkRC 之上封装一些额外的参数，方便后续逻辑处理
 */
export interface MihawkOptions extends Required<MihawkRC> {
  /**
   * mock 目录的绝对路径，默认为 `${CWD}/mocks`
   */
  mockDirPath: string; //

  /**
   * mock data 数据文件目录的绝对路径，默认为 `${CWD}/mocks/data`
   */
  mockDataDirPath: string; //
  /**
   * 当 mockLogicFileType 为 ts | typescript 时为 true
   */
  isTypesctiptMode: boolean; //

  /**
   * 是否开启 https，当且仅当 https 属性是一个对象时开启
   */
  useHttps: boolean;

  /**
   * 当 mockLogicFileType 不是 none 时为 true
   */
  useLogicFile: boolean; //

  /**
   * 当 mockLogicFileType 不是 none 时才会有值，否则是空字符或者 null
   * - 值不包含 . 前缀，eg: ts | js | cjs
   */
  logicFileExt?: string; //

  /**
   * 同 mockDataFileType 一致，为 json 或者 json5，这里多定义一个只是为了代码可读一点，与上面 logicFileExt 形成对比
   * - 值不包含 . 前缀，eg： json | json5
   */
  dataFileExt: string; //

  /**
   * routes.{json|js|cjs|ts} 文件的绝对路径，默认为 `${CWD}/mocks/routes.json`
   */
  routesFilePath: string; //

  /**
   * 自定义中间件的绝对路径，默认为 `${CWD}/mocks/middleware.js`
   */
  middlewareFilePath: string; //
}

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
export type Loosify<T> = Record<string | number | symbol, any> & Partial<T>;
// export type Loosify<T extends Record<string | number | symbol, any>> = {
//   [k: string | number | symbol]: any;
// } & {
//   [k in keyof T]?: T[k];
// };
