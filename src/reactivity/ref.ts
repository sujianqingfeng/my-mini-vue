import { hasChanged, isObject } from "../shared"
import { createDep, Dep } from "./dep"
import {
  activeEffect,
  shouldTrack,
  trackEffects,
  triggerEffects,
} from "./effect"
import { reactive, toReactive } from "./reactive"

declare const RefSymbol: unique symbol

export interface Ref<T = any> {
  value: T
  [RefSymbol]: true
}

// Ref 实现
class RefImpl<T> {
  /**
   * 处理之后的值
   */
  private _value: T
  /**
   * 原始值
   */
  private _rawValue: T
  /**
   * 依赖容器
   */
  public dep?: Dep = undefined
  // ref 标识
  public readonly __v_isRef = true
  constructor(value) {
    this._rawValue = value
    this._value = toReactive(value)
    this.dep = new Set()
  }

  get value() {
    trackRefValue(this)
    return this._value
  }

  set value(val) {
    // 有变化就赋值
    if (hasChanged(this._rawValue, val)) {
      this._rawValue = val
      this._value = toReactive(val)

      if (this.dep) {
        triggerEffects(this.dep)
      }
    }
  }
}

/**
 * 创建单值的响应式
 *
 * @param value
 * @returns
 */
export function ref(value?: unknown) {
  return new RefImpl(value)
}

/**
 *
 * 针对对象中存在ref的处理
 *
 * @param raw
 * @returns
 */
export function proxyRefs(raw) {
  return new Proxy(raw, {
    get(target, key) {
      const res = Reflect.get(target, key)
      // 解构出原值
      return unRef(res)
    },

    set(target, key, newValue) {
      const res = Reflect.get(target, key)

      // 本身是一个ref但是设置的值不是ref类型
      if (isRef(res) && !isRef(newValue)) {
        return (res.value = newValue)
      } else {
        return Reflect.set(target, key, newValue)
      }
    },
  })
}

/**
 * 判断是否是一个ref类型
 *
 * @param r
 * @returns
 */
export function isRef(r: any): r is Ref {
  return !!(r && r.__v_isRef === true)
}

/**
 * 解析出ref中的值
 *
 * @param ref
 * @returns
 */
export function unRef<T>(ref: T | Ref<T>): T {
  return isRef(ref) ? ref.value : ref
}

type RefBase<T> = {
  dep?: Dep
  value: T
}

/**
 * ref的依赖收集
 *
 * @param ref
 */
function trackRefValue(ref: RefBase<any>) {
  if (shouldTrack && activeEffect) {
    trackEffects(ref.dep || (ref.dep = createDep()))
  }
}
