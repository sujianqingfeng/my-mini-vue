# Vue3 响应式数据

vue3 对比最大的变化就是数据劫由 vue2 当中的 [Object.defineProperty](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperty) 变成 Es6 当中的[Proxy](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Proxy)。

在面试当中经常会问到 vue2 的数据响应有什么问题：

- 性能，需要遍历对象中的 key 来进行数据的监听，对象的 key 越多，遍历的时间也越久
- Object.defineProperty 监听属性的变化有限，defineProperty 不能监听到属性的删除，新增，所以有$delete和$set 的 Api 来处理这种情况。本来数组的变化也是不能监听到，vue2 采用了复写了一些方法，来达到监听的目的。复写的方法有 push pop shift unshift splice sort reverse。

而作为代替品的 Proxy，有什么优势呢：

- Proxy 能够直接监听对象
- Proxy 能够监听到对象更多的变化

未完，这几天慢慢写完这篇