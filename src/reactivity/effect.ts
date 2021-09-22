import { extend } from "../shared";

// 全局变量 用来存放 当前effect
let activeEffect;
// 是否应该被收集
let shouldTrack;
class ReactiveEffect {
  _fn: Function;
  deps = [];
  active = true;
  onStop?: () => void;
  constructor(fn) {
    this._fn = fn;
  }

  run() {
    // stop 下的状态
    if (!this.active) {
      return this._fn();
    }

    activeEffect = this;
    shouldTrack = true;
    const result = this._fn();
    shouldTrack = false;
    return result;
  }

  stop() {
    if (this.active) {
      clearUpEffect(this);
      if (this.onStop) {
        this.onStop();
      }
      this.active = false;
    }
  }
}

function clearUpEffect(effect) {
  effect.deps.forEach((dep) => {
    // dep 是一个set
    dep.delete(effect);
  });
}

export function effect(fn, options: any = {}) {
  const _effect = new ReactiveEffect(fn);

  extend(_effect, options);
  _effect.run();

  const runner: any = _effect.run.bind(_effect);
  runner.effect = _effect;

  return runner;
}

const targetMap = new Map();
// 收集依赖
export function track(target, key) {
  let depsMap = targetMap.get(target);

  if (!depsMap) {
    depsMap = new Map();
    targetMap.set(target, depsMap);
  }

  let dep = depsMap.get(key);

  if (!dep) {
    dep = new Set();
    depsMap.set(key, dep);
  }

  // 直接访问属性  不通过effect函数 不用收集依赖
  if (!activeEffect) return;

  if (!shouldTrack) return;

  dep.add(activeEffect);
  // 反向收集  把当前的所有依赖 放入effect当中 比如在使用停止函数的时候进行使用
  activeEffect.deps.push(dep);
}

// 触发依赖
export function trigger(target, key) {
  const depsMap = targetMap.get(target);
  const dep = depsMap.get(key);

  for (const effect of dep) {
    if (effect.scheduler) {
      effect.scheduler();
    } else {
      effect.run();
    }
  }
}

export function stop(runner) {
  runner.effect.stop();
}
