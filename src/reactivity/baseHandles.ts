import { isObject, extend } from "../shared";
import { track, trigger } from "./effect";
import { reactive, ReactiveFlags, readonly } from "./reactive";

// 全局变量  只执行一次
const get = createGetter();
const set = createSetter();
const readonlyGet = createGetter(true);
const shallowReadonlyGet = createGetter(true, true);

// 创建get 函数
function createGetter(isReadonly = false, shallow = false) {
  return function get(target, key) {
    if (key === ReactiveFlags.IS_REACTIVE) {
      return !isReadonly;
    } else if (key === ReactiveFlags.IS_READONLY) {
      return isReadonly;
    }

    const res = Reflect.get(target, key);

    if (shallow) {
      return res;
    }

    // 循环调用 直至不是一个object对象
    if (isObject(res)) {
      return isReadonly ? readonly(res) : reactive(res);
    }

    if (!isReadonly) {
      track(target, key);
    }

    return res;
  };
}

// 创建set函数
function createSetter() {
  return function set(targe, key, value) {
    const res = Reflect.set(targe, key, value);

    trigger(targe, key);
    return res;
  };
}

export const mutableHandles = {
  get,
  set,
};

export const readonlyHandles = {
  get: readonlyGet,
  set: function (target, key, value) {
    console.warn(
      `readonly not call set ,target:${target},key:${key},value:${value}`
    );
    // JavaScript 强制执行某些不变量 — 内部方法和捕捉器必须满足的条件。
    // set 方法必须返回 true 或者 false
    return true;
  },
};

export const shallowReadonlyHandles = extend({}, readonlyHandles, {
  get: shallowReadonlyGet,
});
