import { ReactiveEffect } from "./effect"

export type ComputeGetter<T> = (...args: any[]) => T

// computed 实现
class ComputedRefImpl<T> {
  private _effect: ReactiveEffect
  private _value!: T
  private _dirty = true

  constructor(getter: ComputeGetter<T>) {
    // 当依赖值发生变化 重置dirty值
    // 执行依赖的时候 如果effect存在scheduler就会执行scheduler
    this._effect = new ReactiveEffect(getter, () => {
      this._dirty = true
    })
  }

  get value() {
    // 第一次或者依赖值发生变化的时候
    if (this._dirty) {
      this._dirty = false
      this._value = this._effect.run()
    }
    return this._value
  }
}

/**
 * computed
 *
 * @param getter
 * @returns
 */
export function computed(getter) {
  return new ComputedRefImpl(getter)
}
