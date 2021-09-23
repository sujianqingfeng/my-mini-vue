import { hasChanged, isObject } from "../shared";
import { isTracking, trackEffects, triggerEffects } from "./effect";
import { reactive } from "./reactive";

class RefImpl {
  private _value: any;
  private _rawValue;
  public dep;
  public __v_isRef = true;
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

  shouldTrack() {
    return !isObject(this._rawValue);
  }
}

export function ref(value) {
  return new RefImpl(value);
}

export function proxyRefs(raw) {
  return new Proxy(raw, {
    get(target, key) {
      const res = Reflect.get(target, key);

      return unRef(res);
    },

    set(target, key, newValue) {
      const res = Reflect.get(target, key);

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
  return !!ref.__v_isRef;
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
