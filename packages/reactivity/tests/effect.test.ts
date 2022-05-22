import { effect, stop } from "../src/effect"
import { reactive } from "../src/reactive"

describe("effect", () => {
  test("happy path", () => {
    const user = reactive({ age: 1 })

    let nextAge

    effect(() => {
      nextAge = user.age + 1
    })

    expect(nextAge).toBe(2)

    user.age++

    expect(nextAge).toBe(3)
  })

  test("runner", () => {
    let foo = 1

    const runner = effect(() => {
      foo++

      return "runner"
    })

    expect(foo).toBe(2)

    const result = runner()

    expect(foo).toBe(3)

    expect(result).toBe("runner")
  })

  test("scheduler", () => {
    // scheduler 是在 更新的时候 执行fn的时候 存在 scheduler 就执行scheduler 否则就执行fn
    // 也就是说在触发依赖的时候
    let dummy
    let run: any
    const scheduler = jest.fn(() => {
      run = runner
    })

    const obj = reactive({ foo: 1 })

    const runner = effect(
      () => {
        dummy = obj.foo
      },
      { scheduler }
    )

    expect(scheduler).not.toHaveBeenCalled()

    expect(dummy).toBe(1)

    obj.foo++

    expect(scheduler).toHaveBeenCalledTimes(1)

    expect(dummy).toBe(1)

    run()
    expect(dummy).toBe(2)
  })

  test("stop", () => {
    let dummy
    const obj = reactive({ foo: 1 })

    const runner = effect(() => {
      dummy = obj.foo
    })

    obj.foo = 2

    expect(dummy).toBe(2)

    // stop 停止响应
    stop(runner)
    obj.foo++
    // obj.foo = 3;
    expect(dummy).toBe(2)

    runner()

    expect(dummy).toBe(3)
  })

  // 执行stop函数 清空依赖的时候 如果存在onStop函数 就执行
  test("onStop", () => {
    const obj = reactive({ foo: 1 })

    const onStop = jest.fn()

    let dummy

    const runner = effect(
      () => {
        dummy = obj.foo
      },
      { onStop }
    )

    stop(runner)
    expect(onStop).toHaveBeenCalledTimes(1)
  })
})
