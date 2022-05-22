import { isObject, extend } from "@mini-vue/shared"
import { track, trigger } from "./effect"
import { reactive, ReactiveFlags, readonly, Target } from "./reactive"

// 全局变量  只执行一次
const get = createGetter()
const set = createSetter()
const readonlyGet = createGetter(true)
const shallowReadonlyGet = createGetter(true, true)

/**
 * 创建get 函数
 *
 * @param isReadonly
 * @param shallow
 * @returns
 */
function createGetter(isReadonly = false, shallow = false) {
  return function get(target: Target, key: string | symbol, receiver: object) {
    if (key === ReactiveFlags.IS_REACTIVE) {
      return !isReadonly
    } else if (key === ReactiveFlags.IS_READONLY) {
      return isReadonly
    }

    const res = Reflect.get(target, key, receiver)

    if (shallow) {
      return res
    }

    // 循环调用 直至不是一个object对象
    if (isObject(res)) {
      return isReadonly ? readonly(res) : reactive(res)
    }

    if (!isReadonly) {
      track(target, key)
    }

    return res
  }
}

/**
 * 创建set函数
 *
 * @returns
 */
function createSetter() {
  return function set(
    targe: object,
    key: string | symbol,
    value: unknown,
    receiver: object
  ) {
    const res = Reflect.set(targe, key, value, receiver)

    trigger(targe, key)
    return res
  }
}
/**
 * 变化的 proxy handles
 */
export const mutableHandles = {
  get,
  set,
}

/**
 * 可读取的proxy handles
 */
export const readonlyHandles: ProxyHandler<object> = {
  get: readonlyGet,
  set: function (target, key, value) {
    console.warn(
      `readonly not call set ,target:${target},key:${String(
        key
      )},value:${value}`
    )
    // JavaScript 强制执行某些不变量 — 内部方法和捕捉器必须满足的条件。
    // set 方法必须返回 true 或者 false
    return true
  },
}

/**
 * 表层可读的proxy handles
 */
export const shallowReadonlyHandles = extend({}, readonlyHandles, {
  get: shallowReadonlyGet,
})
