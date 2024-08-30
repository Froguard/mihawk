/**
 * koa 类型
 */
export type {
  Context as KoaContext, //
  Next as KoaNext,
  Request as KoaRequest,
  Response as KoaResponse,
  Middleware as KoaMiddleware,
} from 'koa';
// koa-bodyparser options
export type { Options as KoaBodyParserOptions } from 'koa-bodyparser';

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
  https?: boolean;

  /**
   * mock 目录，默认为 `./mock`
   */
  mockDir?: string;

  /**
   * 是否自动创建 mock 文件，默认 false
   */
  autoCreateMockFile?: boolean;

  /**
   * mock 逻辑文件类型，默认 js
   */
  mockLogicFileType?: 'none' | 'js' | 'javascript' | 'ts' | 'typescript';

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
export interface MihawkRC extends MihawkOptions {
  //
  [k: string]: any;
}

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
