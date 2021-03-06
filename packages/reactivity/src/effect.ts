import { extend } from "@mini-vue/shared"
import { createDep, Dep } from "./dep"

type KeyToDepMap = Map<any, Dep>

// 全局变量 用来存放 当前effect
export let activeEffect: ReactiveEffect | undefined
// 是否应该被收集
export let shouldTrack = true
// 存放依赖的map
const targetMap = new WeakMap<any, KeyToDepMap>()

/**
 * 存储副作用函数
 */
export class ReactiveEffect<T = any> {
  deps: Dep[] = []
  active = true
  onStop?: () => void

  constructor(
    public fn: () => T,
    public scheduler: EffectScheduler | null = null
  ) {}

  run() {
    // stop 下的状态 不用收集依赖
    if (!this.active) {
      return this.fn()
    }
    // 保存当前执行的fn
    activeEffect = this
    // 设置需要收集标识
    shouldTrack = true
    // 执行fn的时候 就会访问响应式数据中的get 从而触发依赖收集
    const result = this.fn()
    // 重置需要收集标识  以防收集到不需要收集的依赖
    shouldTrack = false
    return result
  }

  stop() {
    // 如果没有停止过
    if (this.active) {
      clearUpEffect(this)
      // 存在onStop回调就执行
      this.onStop && this.onStop()
      // 设置停止标识
      this.active = false
    }
  }
}

/**
 *
 * 创建effect
 *
 * @param fn
 * @param options
 * @returns
 */
export function effect<T = any>(fn: () => T, options?: ReactiveEffectOptions) {
  const _effect = new ReactiveEffect(fn)

  // 把一些可选项挂到 effect实例上 比如scheduler、onStop
  extend(_effect, options)
  // 执行fn
  _effect.run()

  // effect函数要返回可对fn执行的函数 并不是fn本身
  const runner: any = _effect.run.bind(_effect)
  // 挂在到runner上面 stop调用的时候需要用到
  runner.effect = _effect

  return runner
}

/**
 * 收集依赖
 *
 * @param target
 * @param key
 * @returns
 */
export function track(target: object, key: unknown) {
  // 判断需要收集

  if (shouldTrack && activeEffect) {
    // 取出存放依赖的容器dep
    let depsMap = targetMap.get(target)

    if (!depsMap) {
      targetMap.set(target, (depsMap = new Map()))
    }

    let dep = depsMap.get(key)

    if (!dep) {
      depsMap.set(key, (dep = createDep()))
    }

    // 开始收集
    trackEffects(dep)
  }
}

/**
 * 抽离依赖收集 ref 要用
 *
 * @param dep
 * @returns
 */
export function trackEffects(dep: Dep) {
  // 处理重复依赖
  shouldTrack = !dep.has(activeEffect!)

  if (shouldTrack) {
    dep.add(activeEffect!)
    // 反向收集  把当前的所有依赖 放入effect当中 比如在使用停止函数的时候进行使用
    activeEffect!.deps.push(dep)
  }
}

/**
 * 触发依赖
 *
 * @param target
 * @param key
 */
export function trigger(target: object, key: unknown) {
  // 取出对应的依赖
  const depsMap = targetMap.get(target)

  if (!depsMap) {
    return
  }

  const dep = depsMap.get(key)

  if (dep) {
    // 执行依赖
    triggerEffects(dep)
  }
}

/**
 * 抽离触发依赖 ref要用
 *
 * @param dep
 */
export function triggerEffects(dep: Dep) {
  // 如果依赖被设置过scheduler就执行scheduler
  for (const effect of dep) {
    if (effect.scheduler) {
      effect.scheduler()
    } else {
      effect.run()
    }
  }
}

/**
 * 清空依赖
 *
 * @param effect
 */
function clearUpEffect(effect: ReactiveEffect) {
  effect.deps.forEach((dep) => {
    // dep 是一个set
    dep.delete(effect)
  })
}

/**
 * 取消响应式数据
 *
 * @param runner
 */
export function stop(runner: any) {
  runner.effect.stop()
}

// /**
//  * 需要收集 同时 通过effect函数触发依赖
//  *
//  * @returns
//  */
// export function isTracking() {
//   return shouldTrack && activeEffect !== undefined
// }

export type EffectScheduler = (...args: any[]) => any
export interface ReactiveEffectOptions {
  lazy?: boolean
  scheduler?: EffectScheduler
  onStop?: () => void
}
