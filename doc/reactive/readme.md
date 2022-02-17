# Vue3 响应式数据

vue3 对比最大的变化就是数据劫由 vue2 当中的 [Object.defineProperty](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperty) 变成 Es6 当中的[Proxy](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Proxy)。

在面试当中经常会问到 vue2 的数据响应有什么问题：

- 性能，需要遍历对象中的 key 来进行数据的监听，对象的 key 越多，遍历的时间也越久
- Object.defineProperty 监听属性的变化有限，defineProperty 不能监听到属性的删除，新增，所以有$delete和$set 的 Api 来处理这种情况。本来数组的变化也是不能监听到，vue2 采用了复写了一些方法，来达到监听的目的。复写的方法有 push pop shift unshift splice sort reverse。

而作为代替品的 Proxy，有什么优势呢：

- Proxy 能够直接监听对象
- Proxy 能够监听到对象更多的变化

## 原理(proxy 实现)

要实现数据的监听，涉及到两个问题

- 收集依赖 track -> get
- 触发依赖 trigger -> set

```
function track() {
  console.log("track call");
}

function trigger() {
  console.log("trigger call");
}

const newObj = new Proxy({a:'test'}, {
  get: function () {
    track();
  },
  set: function () {
    trigger();
  },
});

// 触发依赖
newObj.a;


```

如何触发收集依赖的方法，在 vue3 中有一个函数 effect,
effect 机制一开始就会触发传入的 fn

```
function effect(fn) {
  fn();
}

effect(() => {
  // 收集依赖
  newObj.a;
  console.log("fn 执行");
});
```

然后触发依赖，触发 set 方法就行，实际就是给 proxy 对象设值。当然在之前要把依赖存储起来。

```

// 存储依赖
let dep;
// 存储当前fn
let activeEffect;

function track() {
  // 过滤依赖
  if (activeEffect && dep != activeEffect) {
    dep = activeEffect;
    console.log("track call");
  }
}

function trigger() {
  console.log("trigger call");
  dep && dep();
}

const newObj = new Proxy(
  { a: "test" },
  {
    get: function () {
      track();
    },
    set: function () {
      trigger();
    },
  }
);

function effect(fn) {
  activeEffect = fn;
  fn();
  activeEffect = null;
}

effect(() => {
  // 收集依赖
  newObj.a;
  console.log("fn 执行");
});

// 触发依赖
newObj.a = 1;

```

至此，上面可以简单触发依赖已经收集依赖，以此来理解运行的流程。需要稍微详细的一些实现，可以查看本项目下 reactivity 目录下的 [reactive](../../src/reactivity/reactive.ts) 和 [effect](../../src//reactivity//effect.ts)模块的实现。
