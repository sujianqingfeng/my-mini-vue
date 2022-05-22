import { isObject } from "../../shared/src"
import {
  mutableHandles,
  readonlyHandles,
  shallowReadonlyHandles,
} from "./baseHandles"

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

export interface Target {
  [ReactiveFlags.IS_READONLY]?: boolean
  [ReactiveFlags.IS_REACTIVE]?: boolean
}

/**
 *
 * 响应式
 *
 * @param target
 * @returns
 */
export function reactive(target: object) {
  return createReactiveObject(target, mutableHandles)
}

/**
 * 可读
 *
 * @param target
 * @returns
 */
export function readonly<T extends object>(target: T) {
  return createReactiveObject(target, readonlyHandles)
}

/**
 *
 * 表层可读
 *
 * @param target
 * @returns
 */
export function shallowReadonly<T extends object>(target: T) {
  return createReactiveObject(target, shallowReadonlyHandles)
}

/**
 * 创建响应式对象
 *
 * @param target
 * @param baseHandle
 * @returns
 */
function createReactiveObject(target: object, baseHandle: ProxyHandler<any>) {
  return new Proxy(target, baseHandle)
}

/**
 * 判断是否是一个响应式数据
 *
 * @param value
 * @returns
 */
export function isReactive(value: unknown): boolean {
  return !!(value && (value as Target)[ReactiveFlags.IS_REACTIVE])
}

/**
 * 判断是否是一个readonly数据
 *
 * @param value
 * @returns
 */
export function isReadonly(value: unknown): boolean {
  return !!(value && (value as Target)[ReactiveFlags.IS_READONLY])
}

/**
 * 判断对象是否是一个响应对象  或者 可读对象
 *
 * @param value
 * @returns
 */
export function isProxy(value: unknown): boolean {
  return isReactive(value) || isReadonly(value)
}

/**
 * 根据值得类型转化为响应式的值或者原始值
 *
 * @param value
 * @returns
 */
export function toReactive<T extends unknown>(value: T): T {
  return isObject(value) ? reactive(value) : value
}
