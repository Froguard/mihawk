'use strict';
import Colors from 'color-cc';
import type { DeepReadonly, Unfixedify } from '../com-types';

/**
 * 删除对象中的 null 和 undefined 属性
 * @param {object} obj
 * @returns {void} change obj itself, no returns
 */
export function delNillProps<T extends Record<string, any>>(obj: T) {
  if (obj && typeof obj === 'object') {
    Object.entries(obj).forEach(([k, v]) => {
      if (v === null || v === undefined) {
        delete obj[k];
      }
    });
  }
}

/**
 * 深度冻结对象
 * @param {any} obj
 * @return {void}
 */
export function deepFreeze(obj: any) {
  if (obj) {
    // 1.冻结当前对象
    Object.freeze(obj);
    // 2.遍历对象的所有属性
    Object.getOwnPropertyNames(obj).forEach(prop => {
      const value = obj[prop];
      // 如果属性值是对象并且不是 RegExp 对象（正则表达式会被识别为对象，但不需要冻结）
      if (value && typeof value === 'object' && !(value instanceof RegExp)) {
        deepFreeze(value); // 递归调用 deepFreeze
      }
    });
  }
}

/**
 * 获取一个代理对象，该对象允许读取目标对象上所有属性（包括深层子属性），但不允许修改
 * @param {T} obj
 * @returns {Readonly<T>} new proxy obj
 */
export function createReadonlyProxy<T = any>(obj: T) {
  if (!obj) {
    return obj;
  }

  /**
   * 递归地创建不可修改的代理对象
   * @param {T} target 需要被代理的对象
   * @returns {DeepReadonly<Unfixedify<T>>} 代理后的对象
   */
  function _createProxy<T = any>(target: T): DeepReadonly<Unfixedify<T>> {
    // 情况1: 如果目标是一个普通对象（非null且不是原始类型）
    if (typeof target === 'object' && target !== null) {
      console.log('target', target);
      if (Array.isArray?.(target) || target instanceof Array) {
        // 情况1.1: 如果目标是数组
        return new Proxy(target, {
          get: function (target: any, prop: string | number | symbol, receiver: any) {
            // 特殊属性直接返回，不进行代理
            if (typeof prop === 'symbol' || prop === 'length' || prop === 'constructor') {
              return Reflect.get(target, prop, receiver); // 允许访问 Symbol 属性以及 length 和 constructor
            }
            return _createProxy(Reflect.get(target, prop, receiver));
          },
          // 拒绝修改数组
          set: function (target: any, prop: string | number | symbol, value: any, receiver: any) {
            console.warn(Colors.warn(`Modifying array property "${String(prop)}" is not allowed!`));
            return false;
          },
          // 拒绝删除数组属性
          deleteProperty: function (target: any, prop: string | number | symbol) {
            console.warn(Colors.warn(`Deleting array property "${String(prop)}" is not allowed!`));
            return false;
          },
          // 拦截数组的方法 push, pop 等
          apply: function (target: any, thisArg: any, argList: any[]) {
            // 获取调用的方法名称
            const methodName = Reflect.get(this, 'key');
            // 列出不允许调用的方法
            const forbiddenMethods = ['push', 'pop', 'shift', 'unshift', 'splice', 'sort', 'reverse'];
            if (forbiddenMethods.includes(methodName as string)) {
              console.warn(Colors.warn(`Modifying the readonly array property is not allowed! Don't use method ${methodName}`));
              return false;
            }
            return Reflect.apply(target, thisArg, argList);
          },
        });
      } else {
        // // 情况1.2: 如果目标是普通对象
        return new Proxy(target, {
          //
          get: function (target: any, prop: string, receiver: any) {
            if (!(prop in target)) {
              // 不存在的时候，稍微提示下
              console.warn(Colors.gray(`Property "${prop}" doesn't exist on the object!`));
            }
            return _createProxy(Reflect.get(target, prop, receiver));
          },
          // 拒绝修改属性
          set: function (target: any, prop: string, value: any, receiver: any) {
            console.warn(Colors.warn(`Modifying the readonly property "${prop}" is not allowed!`));
            return false;
          },
          // 拒绝删除属性
          deleteProperty: function (target: any, prop: string) {
            console.warn(Colors.warn(`Deleting the readonly property "${prop}" is not allowed!`));
            return false;
          },
        });
      }
    } else {
      // 情况2: 如果目标不是对象，则直接返回目标值
      return target as any;
    }
  }

  return _createProxy(obj); // 返回带有递归处理的代理对象
}

// // 示例使用
// const originalObject = {
//   name: 'Alice',
//   nested: {
//     age: 30,
//     address: {
//       city: 'Wonderland',
//     },
//   },
//   array: [1, 2, 3],
//   sayHello: () => {
//     console.log('Hello!');
//   },
// };
// // const proxiedObject = createReadonlyProxy(originalObject);
// 读取属性正常工作
// console.log(proxiedObject.name); // 输出 Alice
// console.log(proxiedObject.nested.age); // 输出 30
// proxiedObject.sayHello(); // 输出 Hello!
// console.log(proxiedObject.array[0]); // 输出 1
// 访问不存在的属性
// console.log((proxiedObject as any).abcdefg);
// // 重新赋值
// (proxiedObject as any).name = 1;
// // 尝试删除属性会打印警告且不会删除
// delete (proxiedObject as any).name; // 输出 不允许删除属性 name
// delete proxiedObject.nested.age; // 输出 不允许删除属性 age
// proxiedObject.array.pop(); // 输出 不允许调用方法 pop
