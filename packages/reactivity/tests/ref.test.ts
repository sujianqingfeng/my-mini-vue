import { effect } from "../src/effect"
import { reactive } from "../src/reactive"
import { isRef, proxyRefs, ref, unRef } from "../src/ref"

describe("ref", () => {
  test("happy path", () => {
    const foo = ref(0)

    expect(foo.value).toBe(0)
  })

  test("should be reactive", () => {
    const a = ref(1)

    let dummy
    let calls = 0

    effect(() => {
      calls++
      dummy = a.value
    })

    expect(dummy).toBe(1)
    expect(dummy).toBe(1)

    a.value = 2
    expect(dummy).toBe(2)
    expect(dummy).toBe(2)

    a.value = 2
    expect(dummy).toBe(2)
    expect(dummy).toBe(2)
  })

  test("should make nested properties reactive", () => {
    const a = ref({
      count: 1,
    })

    let dummy
    effect(() => {
      dummy = a.value.count
    })
    a.value.count = 2

    expect(dummy).toBe(2)
  })

  test("isRef", () => {
    const a = ref(1)
    const user = reactive({ age: 1 })

    expect(isRef(a)).toBe(true)
    expect(isRef(1)).toBe(false)
    expect(isRef(user)).toBe(false)
  })

  test("unRef", () => {
    expect(unRef(ref(1))).toBe(1)
    expect(unRef(1)).toBe(1)
  })

  test("proxyRef", () => {
    const user = {
      age: ref(10),
      name: "name",
    }
    const proxyUser = proxyRefs(user)

    expect(user.age.value).toBe(10)
    expect(proxyUser.age).toBe(10)
    expect(proxyUser.name).toBe("name")

    proxyUser.age = 20
    expect(proxyUser.age).toBe(20)
    expect(user.age.value).toBe(20)

    proxyUser.age = ref(10)
    expect(proxyUser.age).toBe(10)
    expect(user.age.value).toBe(10)
  })
})
