'use strict';
import { Debugger } from '../utils/print';
import { createDataResolver } from '../composites/resolve-data';
import type { KoaContext, KoaNext, MihawkOptions } from '../com-types';

/**
 * 中间件生成器
 * @param options
 * @returns
 */
export default function (options?: MihawkOptions) {
  Debugger.log('mdw-mock: init...');
  const calcMockData = createDataResolver(options);

  /**
   * koa 中间件：
   * @param {KoaContext} ctx
   * @param {KoaNext} next
   */
  return async function mock(ctx: KoaContext, next: KoaNext) {
    const { /*disableLogPrint,*/ mockRelPath, routePath } = ctx || {};
    Debugger.log('mdw-mock: >>', routePath, `mockRelPath="${mockRelPath}"`);
    const { skipDefaultMock } = ctx;
    // !disableLogPrint && Printer.log('mdw-mock:', routePath, Colors.gray(`skipDefaultMock=${!!skipDefaultMock}`));
    if (skipDefaultMock) {
      ctx.set('X-Mock-Hit', '0');
      // ================================================
      //
      await next();
      //
      // ================================================
    } else {
      //
      ctx.status = 200;
      ctx.set('Content-Type', 'application/json');
      ctx.set('X-Mock-Hit', '1');
      //
      const mockJson = await calcMockData(ctx);
      ctx.hitDefaultMock = true; // 打个标记，方便后续判断
      Debugger.log('mdw-mock: mockData=', mockJson);
      // 直接写 json 对象，不进行序列化，也能识别
      ctx.body = mockJson; // ctx.body = JSON.stringify(mockJson);
      //
    }
    //
    Debugger.log('mdw-mock: <<', routePath);
  };
}
