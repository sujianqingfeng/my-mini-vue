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
