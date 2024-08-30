/**
 * mihawk options
 */
export interface MihawkOptions {
  /**
   * 监听地址
   */
  host?: string;
  /**
   * 监听端口
   */
  port?: number;
  /**
   * 是否开启 https
   */
  https?: boolean;
  /**
   * mock 目录
   */
  mockDir?: string;
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
