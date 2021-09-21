import { isReactive, reactive } from "../reactive";

describe("reactive", () => {
  test("happy path", () => {
    const original = {
      age: 1,
    };

    const observed = reactive(original);

    expect(isReactive(observed)).toBe(true);
  });
});
