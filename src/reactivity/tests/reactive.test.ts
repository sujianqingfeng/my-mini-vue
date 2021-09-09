import { reactive } from "../reactvie";

describe("reactive", () => {
  test("happy path", () => {
    const original = { foo: 1 };

    const observed = reactive(original);

    expect(observed).not.toBe(original);

    expect(observed.foo).toBe(1);
  });
});
