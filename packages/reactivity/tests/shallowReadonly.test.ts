import { isReadonly, shallowReadonly } from "../src/reactive"

// shallow readonly 表层是可读的 内部是普通的对象
// 可应用与一些场景的优化
describe("shallowReadonly", () => {
  test("should not make non-reactive properties reactive", () => {
    const props = shallowReadonly({ n: { foo: 1 } })

    expect(isReadonly(props)).toBe(true)
    expect(isReadonly(props.n)).toBe(false)
  })
})
