import { hasChanged, isObject } from "../shared";
import { isTracking, trackEffects, triggerEffects } from "./effect";
import { reactive } from "./reactive";

const IS_REF_SYMBOL = Symbol("__v_isRef");

// Ref 实现
class RefImpl {
  /**
   * 处理之后的值
   */
  private _value: any;
  /**
   * 原始值
   */
  private _rawValue: any;
  /**
   * 依赖容器
   */
  public dep;
  // ref 标识
  [IS_REF_SYMBOL] = true;
  constructor(value) {
    this._value = convert(value);
    this._rawValue = value;
    this.dep = new Set();
  }

  get value() {
    trackRefValue(this);
    return this._value;
  }

  set value(val) {
    // 有变化就赋值
    if (hasChanged(this._rawValue, val)) {
      this._value = convert(val);
      this._rawValue = val;

      triggerEffects(this.dep);
    }
  }

  /**
   * 判断是否需要收集
   * 如果value是一个对象 就交给了reactive处理 就不需要本身的dep来进行依赖收集了
   *
   * @returns
   */
  shouldTrack() {
    return !isObject(this._rawValue);
  }
}

/**
 * 创建单值的响应式
 *
 * @param value
 * @returns
 */
export function ref(value: any) {
  return new RefImpl(value);
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
      const res = Reflect.get(target, key);
      // 解构出原值
      return unRef(res);
    },

    set(target, key, newValue) {
      const res = Reflect.get(target, key);

      // 本身是一个ref但是设置的值不是ref类型
      if (isRef(res) && !isRef(newValue)) {
        return (res.value = newValue);
      } else {
        return Reflect.set(target, key, newValue);
      }
    },
  });
}

/**
 * 判断是否是一个ref类型
 *
 * @param ref
 * @returns
 */
export function isRef(ref) {
  return !!ref[IS_REF_SYMBOL];
}

/**
 * 解析出ref中的值
 *
 * @param ref
 * @returns
 */
export function unRef(ref) {
  return isRef(ref) ? ref.value : ref;
}

/**
 * 根据值得类型转化为响应式的值或者原始值
 *
 * @param value
 * @returns
 */
function convert(value) {
  return isObject(value) ? reactive(value) : value;
}

/**
 * ref的依赖收集
 *
 * @param ref
 */
function trackRefValue(ref) {
  if (isTracking() && ref.shouldTrack()) {
    trackEffects(ref.dep);
  }
}
