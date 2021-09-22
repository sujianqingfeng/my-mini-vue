import { isProxy, isReadonly, readonly } from "../reactive";

describe("readonly", () => {
  test("happy path", () => {
    const original = { foo: 1, bar: { baz: 2 } };

    const wrapped = readonly(original);

    expect(wrapped).not.toBe(original);

    expect(wrapped.foo).toBe(1);

    expect(isReadonly(wrapped)).toBe(true);
    expect(isProxy(wrapped)).toBe(true);
  });

  test("readonly not call set", () => {
    console.warn = jest.fn();
    const foo = readonly({ age: 1 });

    foo.age = 2;

    expect(console.warn).toBeCalled();
  });
});
