export * from "./toDisplayString";

export const extend = Object.assign;

// 判断是否为一个对象
export const isObject = (value) => value !== null && typeof value === "object";

export const isString = (value) => typeof value === "string";

export const hasChanged = (value, newValue) => !Object.is(value, newValue);

export const hasOwn = (target, key) =>
  Object.prototype.hasOwnProperty.call(target, key);

/**
 * 判断字符串开头存在on
 *
 * @param key
 * @returns
 */
export const isOn = (key: string) => /^on[A-Z]/.test(key);

/**
 * 处理 xx-xx  形式的格式 变为 xxXx 格式
 *
 * @param str
 * @returns
 */

export const camelize = (str: string) => {
  return str.replace(/-(\w)/g, (_, c) => {
    return c ? c.toUpperCase() : "";
  });
};

export const capitalize = (str: string) => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

export const toHandleKey = (str: string) => {
  return str ? "on" + capitalize(str) : "";
};
