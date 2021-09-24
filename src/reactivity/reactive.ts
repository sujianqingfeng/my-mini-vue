import {
  mutableHandles,
  readonlyHandles,
  shallowReadonlyHandles,
} from "./baseHandles";

export enum ReactiveFlags {
  /**
   * 响应标记
   */
  IS_REACTIVE = "__v_isReactive",
  /**
   * 可读标记
   */
  IS_READONLY = "__v_isReadonly",
}

/**
 *
 * 响应式
 *
 * @param raw
 * @returns
 */
export function reactive(raw: object) {
  return createReactiveObject(raw, mutableHandles);
}

/**
 * 可读
 *
 * @param raw
 * @returns
 */
export function readonly(raw: object) {
  return createReactiveObject(raw, readonlyHandles);
}

/**
 *
 * 表层可读
 *
 * @param raw
 * @returns
 */
export function shallowReadonly(raw: object) {
  return createReactiveObject(raw, shallowReadonlyHandles);
}

/**
 * 创建响应式对象
 *
 * @param raw
 * @param baseHandle
 * @returns
 */
function createReactiveObject(raw: any, baseHandle: ProxyHandler<any>) {
  return new Proxy(raw, baseHandle);
}

/**
 * 判断是否是一个响应式数据
 *
 * @param value
 * @returns
 */
export function isReactive(value: any) {
  return !!value[ReactiveFlags.IS_REACTIVE];
}

/**
 * 判断是否是一个readonly数据
 *
 * @param value
 * @returns
 */
export function isReadonly(value: any) {
  return !!value[ReactiveFlags.IS_READONLY];
}

/**
 * 判断对象是否是一个响应对象  或者 可读对象
 *
 * @param value
 * @returns
 */
export function isProxy(value) {
  return isReactive(value) || isReadonly(value);
}
