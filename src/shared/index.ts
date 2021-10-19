export const extend = Object.assign;

// 判断是否为一个对象
export const isObject = (value) => value !== null && typeof value === "object";

export const hasChanged = (value, newValue) => !Object.is(value, newValue);

export const hasOwn = (target, key) =>
  Object.prototype.hasOwnProperty.call(target, key);
