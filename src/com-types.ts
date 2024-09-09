'use strict';
import type { ParsedArgs } from 'minimist';

/**
 * koa 类型
 */
// export type {
//   Middleware as KoaMiddleware, // async (ctx: Koa.Context, next: Koa.Next) => void
//   Context as KoaContext, // Koa.Context
//   Next as KoaNext, // Koa.Next
//   Request as KoaRequest, // Koa.Request
//   Response as KoaResponse, // Koa.Response
// } from 'koa';
import type { Middleware, Context, Next, BaseRequest, Request, Response } from 'koa';
// koa-bodyparser options
export type { Options as KoaBodyParserOptions } from 'koa-bodyparser';

// koa 扩展
declare module 'koa' {
  interface Context {
    /**
     * 默认为 false，即：需要打印
     */
    disableLogPrint?: boolean;

    /**
     * 跳过执行默认的 mock 逻辑，默认为 false，即：都是需要处理的
     * - default mock 逻辑的中间件 middleware/mock.ts 是最后一个执行的中间件，如果设置 skipDefaultMock 为 true，该部分逻辑将会跳过
     */
    skipDefaultMock?: boolean;

    /**
     * Method + Path
     * - 初始化详见在 middlewares/common.ts  中逻辑代码
     */
    routePath: string;

    /**
     * mock 文件的相对路径(相对于 data 目录)，比如 'GET /a/b' => '/GET/a/b'
     * - 初始化详见在 middlewares/common.ts  中逻辑代码
     * - 可通过动态设置 `ctx.mockRelPath` 来覆盖，比如 middlewares/route.ts 中就是通过动态设置 `ctx.mockRelPath` 来达到 route 重定向的效果
     */
    mockRelPath: string;

    /**
     * 是否已经采取默认的 mock 逻辑，默认为 false，即：还未处理过
     * - 在执行完 middleware/mock 这个中间件之后，如果走的是默认逻辑，这个值会被设置为 true，详见 middlewares/mock.ts
     */
    hitDefaultMock?: boolean;
  }
  interface Request {
    //
  }
  interface Response {
    //
  }
}

/**
 * koa 类型二次导出
 */
export type KoaMiddleware = Middleware;
export type KoaContext = Context;
export type KoaNext = Next;
export type KoaRequest = Request;
export type KoaResponse = Response;

/**
 * 将 koa 的 BaseRequest 进行扩展，添加 body 和 rawBody 属性
 */
export type BaseRequestEx = BaseRequest & {
  /**
   * parsed body, define by koa-bodyparser
   */
  body?: any;
  /**
   * rawBody, string, define by koa-bodyparser
   */
  rawBody?: string;
};

/**
 * Mock 数据转换器函数中 extra 参数的类型
 * - extra 只是个代理对 ctx.request 的对象，包含 ctx.request 上的 url,method,path,query,body 等属性,
 * - extra 上所有子属性，以及子属性的子属性，都是 Readonly 只读的
 */
export type MhkCvtrExtra = DeepReadonly<Unfixedify<BaseRequestEx>>;

/**
 * Mock 数据转换器
 */
export type MockDataConvertor<T extends Record<string, any> = JSONObject> = (
  /**
   * json data
   */
  originData: T,
  /**
   * extra 对象，包含 ctx 上的 url,method,path,query,body 等属性
   * - 注意，但不等价于 ctx 对象，而是一个只读对象，值从 ctx 上获取而已
   */
  extra: MhkCvtrExtra,
) => Promise<T>;

/**
 * https 配置
 */
export interface HttpsConfig {
  /**
   * key 文件路径
   */
  key: string;
  /**
   * cert 文件路径
   */
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
  https?: boolean | HttpsConfig;

  /**
   * 是否开启 cors，默认 true
   */
  cors?: boolean;

  /**
   * 是否开启 watch（mock 文件变化的时候，进行刷新），默认 true
   * - watch=true 时，无论是否设置 cache，文件变化必然触发缓存刷新
   * - watch=false 时，是否走缓存，则完全看 cache 字段的逻辑
   *
   * 所以，watch 和 cache 并不冲突（ watch 控制文件变化时候的缓存策略,cache 控制常规情况的缓存策略 ）
   */
  watch?: boolean;

  /**
   * 对 mock 文件进行缓存，默认 true
   * - true: mock 文件的加载，会走缓存，不会每次都重新加载文件（缓存的生成为第一次加载时产生）
   * - false: mock 文件的加载，不会走缓存，每次都重新加载文件
   *
   * 其他：当 watch=true 时
   * - 只要 mock 文件变化，缓存必刷新
   * - 但 mock 文件不变化时，是否走缓存，就看 cache 字段的设置（即：同上逻辑）
   *
   * 所以，cache 和 watch 并不冲突（ cache 控制常规情况的缓存策略，watch 控制文件变化时候的缓存策略 ）
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
   * mock 逻辑文件类型，默认 none
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
 * mock 数据文件后缀
 */
export type DataFileExt = 'json' | 'json5';

/**
 * mock 逻辑文件后缀
 */
export type LoigicFileExt = 'js' | 'cjs' | 'ts' | '';

/**
 * Mihawk 启动参数, 在 MihawkRC 之上封装一些额外的参数，方便后续逻辑处理
 */
export type MihawkOptions = MihawkRC & {
  /**
   * @extra
   * mock 目录的绝对路径，默认为 `${CWD}/mocks`
   * - 初始化详见 rc.ts 中的 formatOptionsByConfig 方法
   */
  mockDirPath: string; //

  /**
   * @extra
   * mock data 数据文件目录的绝对路径，默认为 `${CWD}/mocks/data`
   * - 初始化详见 rc.ts 中的 formatOptionsByConfig 方法
   */
  mockDataDirPath: string; //
  /**
   * @extra
   * 当 mockLogicFileType 为 ts | typescript 时为 true
   * - 初始化详见 rc.ts 中的 formatOptionsByConfig 方法
   */
  isTypesctiptMode: boolean; //

  /**
   * @extra
   * 是否开启 https，当且仅当 https 属性是一个对象时开启
   * - 初始化详见 rc.ts 中的 formatOptionsByConfig 方法
   */
  useHttps: boolean;

  /**
   * @extra
   * 当 mockLogicFileType 不是 none 时为 true
   * - 初始化详见 rc.ts 中的 formatOptionsByConfig 方法
   */
  useLogicFile: boolean; //

  /**
   * @extra
   * 当 mockLogicFileType 不是 none 时才会有值，否则是空字符或者 null
   * - 值不包含 . 前缀，eg: ts | js | cjs
   * - 初始化详见 rc.ts 中的 formatOptionsByConfig 方法
   */
  logicFileExt?: LoigicFileExt | null; //

  /**
   * @extra
   * 同 mockDataFileType 一致，为 json 或者 json5，这里多定义一个只是为了代码可读一点，与上面 logicFileExt 形成对比
   * - 值不包含 . 前缀，eg： json | json5
   * - 初始化详见 rc.ts 中的 formatOptionsByConfig 方法
   */
  dataFileExt: DataFileExt; //

  /**
   * @extra
   * routes.{json|json5|js|cjs|ts} 文件的绝对路径，默认为 `${CWD}/mocks/routes.json`
   * - 初始化详见 rc.ts 中的 formatOptionsByConfig 方法
   */
  routesFilePath: string; //

  /**
   * @extra
   * 自定义中间件的绝对路径，默认为空，推荐为 `${CWD}/mocks/middleware.js`
   * - 初始化详见 rc.ts 中的 formatOptionsByConfig 方法
   */
  middlewareFilePath: string; //
};

/**
 * cli 命令行参数
 */
export type CliArgs<T extends Record<string, any> = any> = Loosify<ParsedArgs & T>;

/**
 * subCmd 主逻辑对应的回调函数
 */
export type SubCmdCallback<T = any> = (cliArg?: CliArgs<T>) => Promise<void>;

//
//
// =============================================== base types ===============================================
//
//

/**
 * any function
 */
export type AnyFunc = (...args: any[]) => any;

/**
 * JSON 对象属性的 value 常规定义
 */
export type JSONValue = null | boolean | number | string | JSONValue[] | { [key: string]: JSONValue };

/**
 * JSON 对象常规定义
 */
export type JSONObject = Record<string | number, JSONValue>;

/**
 * 深度递归式让复杂类型的所有子属性都变成可选的。此泛型声明式为了弥补 Partial<T> 的不足
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends AnyFunc ? T[P] : DeepPartial<T[P]>;
};

/**
 * 深度递归式让复杂类型的所有子属性都变成只读的。此泛型声明式为了弥补 Readonly<T> 的不足
 * - 兼容子属性为函数类型
 */
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends AnyFunc ? T[P] : DeepReadonly<T[P]>;
};

/**
 * 让对象 T 中的子属性变成“松散”(可自定义)
 */
export type Unfixedify<T> = T & {
  [k: string | number | symbol]: any;
};

/**
 * 让对象 T 中的子属性变成“宽松”(可选&可自定义)
 * - 1.子属性可选的
 * - 2.子属性可自定义，即 { [k: string | number | symbol]: any }
 *
 * 可用于“一些对象可能长得像某个类型时，但子属性又不局限于这个类型定义”的场景
 */
export type Loosify<T> = Unfixedify<DeepPartial<T>>;
// export type Loosify<T extends Record<string | number | symbol, any>> = {
//   [k: string | number | symbol]: any;
// } & {
//   [k in keyof T]?: T[k];
// };
