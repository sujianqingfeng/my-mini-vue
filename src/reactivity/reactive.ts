import { track, trigger } from "./effect";

export function reactive(raw) {
  return new Proxy(raw, {
    get(target, key) {
      const res = Reflect.get(target, key);

      track(target, key);
      return res;
    },

    set(targe, key, value) {
      const res = Reflect.set(targe, key, value);

      trigger(targe, key);
      return res;
    },
  });
}
