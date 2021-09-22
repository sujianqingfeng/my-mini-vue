import { isProxy, isReactive, reactive } from "../reactive";

describe("reactive", () => {
  test("happy path", () => {
    const original = {
      age: 1,
    };

    const observed = reactive(original);

    expect(isReactive(observed)).toBe(true);

    expect(isProxy(observed)).toBe(true);
  });

  test("nested reactive", () => {
    const original = {
      nested: {
        foo: 1,
      },
      array: [{ bar: 2 }],
    };

    const observed = reactive(original);

    expect(isReactive(observed.nested)).toBe(true);
    expect(isReactive(observed.array)).toBe(true);
    expect(isReactive(observed.array[0])).toBe(true);
  });
});
