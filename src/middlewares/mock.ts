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
      Printer.log('mdw-mock', routePath, 'TODO: mock 逻辑尚待实现...');
    }
    //
    Debugger.log('mdw-mock <<', routePath);
  };
}
