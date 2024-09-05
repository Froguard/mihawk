'use strict';
import Colors from 'color-cc';
import { Printer, Debugger } from '../utils/print';
import type { KoaContext, KoaNext, MihawkOptions } from '../com-types';

/**
 * 中间件生成器
 * @param options
 * @returns
 */
export default function (options?: MihawkOptions) {
  Debugger.log('mdw-mock init...');

  /**
   * koa 中间件：
   * @param {KoaContext} ctx
   * @param {KoaNext} next
   */
  return async function mock(ctx: KoaContext, next: KoaNext) {
    const { disableLogPrint, mockPath, routePath } = ctx || {};
    Debugger.log('mdw-mock >>', routePath);
    const { skipDefaultMock } = ctx;
    !disableLogPrint && Printer.log('mdw-mock', routePath, Colors.gray(`↔ ${mockPath}`), Colors.gray(`skipDefaultMock=${!!skipDefaultMock}`));
    if (skipDefaultMock) {
      // ================================================
      //
      await next();
      //
      // ================================================
    } else {
      /**
       * 【警告】需要依据 mockPath 值来决定查找那个 mock 文件来进行如何处理
       * （因为前面的 routes.ts 中间件中，会根据 routes.json 文件中的 kv 匹配进行重定向）
       */
      Printer.log('mdw-mock', `${routePath} → ${mockPath}`, 'TODO: mock 逻辑尚待实现...');
      // TODO: 待实现
    }
    //
    Debugger.log('mdw-mock <<', routePath);
  };
}
