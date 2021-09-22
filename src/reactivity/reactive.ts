import {
  mutableHandles,
  readonlyHandles,
  shallowReadonlyHandles,
} from "./baseHandles";

export enum ReactiveFlags {
  IS_REACTIVE = "_v_isReactive",
  IS_READONLY = "_v_isReadonly",
}

export function reactive(raw) {
  return createReactiveObject(raw, mutableHandles);
}

export function readonly(raw) {
  return createReactiveObject(raw, readonlyHandles);
}

export function shallowReadonly(raw) {
  return createReactiveObject(raw, shallowReadonlyHandles);
}

export function isReactive(value) {
  return !!value[ReactiveFlags.IS_REACTIVE];
}

export function isReadonly(value) {
  return !!value[ReactiveFlags.IS_READONLY];
}

// 判断对象是否是一个响应对象  或者 可读对象
export function isProxy(value) {
  return isReactive(value) || isReadonly(value);
}

function createReactiveObject(raw: any, baseHandle) {
  return new Proxy(raw, baseHandle);
}
