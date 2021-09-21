import { mutableHandles, readonlyHandles } from "./baseHandles";

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

export function isReactive(value) {
  return !!value[ReactiveFlags.IS_REACTIVE];
}

export function isReadonly(value) {
  return !!value[ReactiveFlags.IS_READONLY];
}

function createReactiveObject(raw: any, baseHandle) {
  return new Proxy(raw, baseHandle);
}
