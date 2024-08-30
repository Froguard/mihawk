/**
 * 判断是否为 null 或 undefined
 * @param {unknown} value
 * @returns
 */
export function isNil(value: unknown): value is null | undefined {
  return value === null || value === undefined;
}
