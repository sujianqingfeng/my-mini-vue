/*! *****************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */

function __values(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
}

function __read(o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
}

function __spreadArray(to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
}

var extend = Object.assign;
// 判断是否为一个对象
var isObject = function (value) { return value !== null && typeof value === "object"; };
var hasChanged = function (value, newValue) { return !Object.is(value, newValue); };
var hasOwn = function (target, key) {
    return Object.prototype.hasOwnProperty.call(target, key);
};
/**
 * 判断字符串开头存在on
 *
 * @param key
 * @returns
 */
var isOn = function (key) { return /^on[A-Z]/.test(key); };
/**
 * 处理 xx-xx  形式的格式 变为 xxXx 格式
 *
 * @param str
 * @returns
 */
var camelize = function (str) {
    return str.replace(/-(\w)/g, function (_, c) {
        return c ? c.toUpperCase() : "";
    });
};
var capitalize = function (str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
};
var toHandleKey = function (str) {
    return str ? "on" + capitalize(str) : "";
};

// 全局变量 用来存放 当前effect
var activeEffect;
// 是否应该被收集
var shouldTrack;
// 存放依赖的map
var targetMap = new Map();
/**
 * 存储副作用函数
 */
var ReactiveEffect = /** @class */ (function () {
    function ReactiveEffect(fn, scheduler) {
        this.deps = [];
        this.active = true;
        this._fn = fn;
        this.scheduler = scheduler;
    }
    ReactiveEffect.prototype.run = function () {
        // stop 下的状态 不用收集依赖
        if (!this.active) {
            return this._fn();
        }
        // 保存当前执行的fn
        activeEffect = this;
        // 设置需要收集标识
        shouldTrack = true;
        // 执行fn的时候 就会访问响应式数据中的get 从而触发依赖收集
        var result = this._fn();
        // 重置需要收集标识  以防收集到不需要收集的依赖
        shouldTrack = false;
        return result;
    };
    ReactiveEffect.prototype.stop = function () {
        // 如果没有停止过
        if (this.active) {
            clearUpEffect(this);
            // 存在onStop回调就执行
            this.onStop && this.onStop();
            // 设置停止标识
            this.active = false;
        }
    };
    return ReactiveEffect;
}());
/**
 *
 * 创建effect
 *
 * @param fn
 * @param options
 * @returns
 */
function effect(fn, options) {
    if (options === void 0) { options = {}; }
    var _effect = new ReactiveEffect(fn);
    // 把一些可选项挂到 effect实例上 比如scheduler、onStop
    extend(_effect, options);
    // 执行fn
    _effect.run();
    // effect函数要返回可对fn执行的函数 并不是fn本身
    var runner = _effect.run.bind(_effect);
    // 挂在到runner上面 stop调用的时候需要用到
    runner.effect = _effect;
    return runner;
}
/**
 * 收集依赖
 *
 * @param target
 * @param key
 * @returns
 */
function track(target, key) {
    // 不需要收集直接返回
    if (!isTracking())
        return;
    // 取出存放依赖的容器dep
    var depsMap = targetMap.get(target);
    if (!depsMap) {
        depsMap = new Map();
        targetMap.set(target, depsMap);
    }
    var dep = depsMap.get(key);
    if (!dep) {
        dep = new Set();
        depsMap.set(key, dep);
    }
    // 开始收集
    trackEffects(dep);
}
/**
 * 抽离依赖收集 ref 要用
 *
 * @param dep
 * @returns
 */
function trackEffects(dep) {
    // 处理重复依赖
    if (dep.has(activeEffect))
        return;
    dep.add(activeEffect);
    // 反向收集  把当前的所有依赖 放入effect当中 比如在使用停止函数的时候进行使用
    activeEffect.deps.push(dep);
}
/**
 * 触发依赖
 *
 * @param target
 * @param key
 */
function trigger(target, key) {
    // 取出对应的依赖
    var depsMap = targetMap.get(target);
    var dep = depsMap.get(key);
    // 执行依赖
    triggerEffects(dep);
}
/**
 * 抽离触发依赖 ref要用
 *
 * @param dep
 */
function triggerEffects(dep) {
    var e_1, _a;
    try {
        // 如果依赖被设置过scheduler就执行scheduler
        for (var dep_1 = __values(dep), dep_1_1 = dep_1.next(); !dep_1_1.done; dep_1_1 = dep_1.next()) {
            var effect_1 = dep_1_1.value;
            if (effect_1.scheduler) {
                effect_1.scheduler();
            }
            else {
                effect_1.run();
            }
        }
    }
    catch (e_1_1) { e_1 = { error: e_1_1 }; }
    finally {
        try {
            if (dep_1_1 && !dep_1_1.done && (_a = dep_1.return)) _a.call(dep_1);
        }
        finally { if (e_1) throw e_1.error; }
    }
}
/**
 * 清空依赖
 *
 * @param effect
 */
function clearUpEffect(effect) {
    effect.deps.forEach(function (dep) {
        // dep 是一个set
        dep.delete(effect);
    });
}
/**
 *   // 需要收集  同时 通过effect函数触发依赖
 *
 * @returns
 */
function isTracking() {
    return shouldTrack && activeEffect !== undefined;
}

var emit = function (instance, event) {
    var args = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        args[_i - 2] = arguments[_i];
    }
    var props = instance.props;
    var handleName = toHandleKey(camelize(event));
    var handler = props[handleName];
    handler === null || handler === void 0 ? void 0 : handler.apply(void 0, __spreadArray([], __read(args), false));
};

// 全局变量  只执行一次
var get = createGetter();
var set = createSetter();
var readonlyGet = createGetter(true);
var shallowReadonlyGet = createGetter(true, true);
/**
 * 创建get 函数
 *
 * @param isReadonly
 * @param shallow
 * @returns
 */
function createGetter(isReadonly, shallow) {
    if (isReadonly === void 0) { isReadonly = false; }
    if (shallow === void 0) { shallow = false; }
    return function get(target, key) {
        if (key === ReactiveFlags.IS_REACTIVE) {
            return !isReadonly;
        }
        else if (key === ReactiveFlags.IS_READONLY) {
            return isReadonly;
        }
        var res = Reflect.get(target, key);
        if (shallow) {
            return res;
        }
        // 循环调用 直至不是一个object对象
        if (isObject(res)) {
            return isReadonly ? readonly(res) : reactive(res);
        }
        if (!isReadonly) {
            track(target, key);
        }
        return res;
    };
}
/**
 * 创建set函数
 *
 * @returns
 */
function createSetter() {
    return function set(targe, key, value) {
        var res = Reflect.set(targe, key, value);
        trigger(targe, key);
        return res;
    };
}
/**
 * 变化的 proxy handles
 */
var mutableHandles = {
    get: get,
    set: set,
};
/**
 * 可读取的proxy handles
 */
var readonlyHandles = {
    get: readonlyGet,
    set: function (target, key, value) {
        console.warn("readonly not call set ,target:" + target + ",key:" + key + ",value:" + value);
        // JavaScript 强制执行某些不变量 — 内部方法和捕捉器必须满足的条件。
        // set 方法必须返回 true 或者 false
        return true;
    },
};
/**
 * 表层可读的proxy handles
 */
var shallowReadonlyHandles = extend({}, readonlyHandles, {
    get: shallowReadonlyGet,
});

var ReactiveFlags;
(function (ReactiveFlags) {
    /**
     * 响应标记
     */
    ReactiveFlags["IS_REACTIVE"] = "__v_isReactive";
    /**
     * 可读标记
     */
    ReactiveFlags["IS_READONLY"] = "__v_isReadonly";
})(ReactiveFlags || (ReactiveFlags = {}));
/**
 *
 * 响应式
 *
 * @param raw
 * @returns
 */
function reactive(raw) {
    return createReactiveObject(raw, mutableHandles);
}
/**
 * 可读
 *
 * @param raw
 * @returns
 */
function readonly(raw) {
    return createReactiveObject(raw, readonlyHandles);
}
/**
 *
 * 表层可读
 *
 * @param raw
 * @returns
 */
function shallowReadonly(raw) {
    return createReactiveObject(raw, shallowReadonlyHandles);
}
/**
 * 创建响应式对象
 *
 * @param raw
 * @param baseHandle
 * @returns
 */
function createReactiveObject(raw, baseHandle) {
    return new Proxy(raw, baseHandle);
}

function initProps(instance, props) {
    instance.props = props || {};
}

var publicPropertiesMap = {
    $el: function (i) { return i.vnode.el; },
    $slots: function (i) { return i.slots; },
    $props: function (i) { return i.props; },
};
var componentPublicHandler = {
    get: function (_a, key) {
        var instance = _a._;
        var setupState = instance.setupState, props = instance.props;
        if (hasOwn(setupState, key)) {
            return setupState[key];
        }
        else if (hasOwn(props, key)) {
            return props[key];
        }
        var publicGetter = publicPropertiesMap[key];
        if (publicGetter) {
            return publicGetter(instance);
        }
    },
};

function initSlots(instance, children) {
    var vnode = instance.vnode;
    if (vnode.shapeFlags & 16 /* SLOT_CHILDREN */) {
        normalizeObjectSlots(children, instance.slots);
    }
}
function normalizeObjectSlots(children, slots) {
    var _loop_1 = function (key) {
        // 取出fun
        var value = children[key];
        // 重新构建一个函数，用来传递参数
        slots[key] = function (props) { return normalizeSlotValue(value(props)); };
    };
    for (var key in children) {
        _loop_1(key);
    }
}
function normalizeSlotValue(value) {
    return Array.isArray(value) ? value : [value];
}

function createComponentInstance(vnode, parent) {
    var instance = {
        vnode: vnode,
        next: null,
        type: vnode.type,
        setupState: {},
        props: undefined,
        parent: parent,
        provides: parent ? parent.provides : {},
        slots: {},
        isMounted: false,
        subTree: {},
        emit: function () { },
    };
    instance.emit = emit;
    return instance;
}
function setupComponent(instance) {
    // initProps
    initProps(instance, instance.vnode.props);
    // initSlots
    initSlots(instance, instance.vnode.children);
    setupStatefulComponent(instance);
}
function setupStatefulComponent(instance) {
    var Component = instance.type;
    // 组件代理
    instance.proxy = new Proxy({ _: instance }, componentPublicHandler);
    var setup = Component.setup;
    if (setup) {
        setCurrentInstance(instance);
        var setupResult = setup(shallowReadonly(instance.props), {
            emit: instance.emit.bind(null, instance),
        });
        handleSetupResult(instance, setupResult);
        setCurrentInstance(null);
    }
}
function handleSetupResult(instance, setupResult) {
    // 返回对象
    if (typeof setupResult === "object") {
        instance.setupState = proxyRefs(setupResult);
    }
    // TODO function
    finishComponentSetup(instance);
}
function finishComponentSetup(instance) {
    var Component = instance.type;
    if (!instance.render) {
        instance.render = Component.render;
    }
}
var currentInstance = null;
function setCurrentInstance(instance) {
    currentInstance = instance;
}
function getCurrentInstance() {
    return currentInstance;
}

var Fragment = Symbol("Fragment");
var Text = Symbol("Text");
function createVNode(type, props, children) {
    var vnode = {
        type: type,
        props: props,
        children: children,
        el: null,
        component: null,
        key: props && props.key,
        shapeFlags: getShapeFlags(type),
    };
    if (typeof children === "string") {
        vnode.shapeFlags |= 4 /* TEXT_CHILDREN */;
    }
    else if (Array.isArray(children)) {
        vnode.shapeFlags |= 8 /* ARRAY_CHILDREN */;
    }
    if (vnode.shapeFlags & 2 /* STATEFUL_COMPONENT */) {
        if (typeof children === "object") {
            vnode.shapeFlags |= 16 /* SLOT_CHILDREN */;
        }
    }
    return vnode;
}
function createTextVNode(text) {
    return createVNode(Text, {}, text);
}
function getShapeFlags(type) {
    return typeof type === "string"
        ? 1 /* ELEMENT */
        : 2 /* STATEFUL_COMPONENT */;
}

function createAppAPI(render) {
    return function createApp(rootComponent) {
        return {
            mount: function (rootContainer) {
                var vnode = createVNode(rootComponent);
                render(vnode, rootContainer);
            },
        };
    };
}

/**
 *  判断组件是否需要更新
 * @param prevVNode
 * @param nextVNode
 * @returns
 */
function shouldUpdateComponent(prevVNode, nextVNode) {
    var prevProps = prevVNode.props;
    var nextProps = nextVNode.props;
    for (var key in nextProps) {
        if (nextProps[key] !== prevProps[key]) {
            return true;
        }
    }
    return false;
}

var p = Promise.resolve();
var nextTick = function (fn) {
    return fn ? p.then(fn) : p;
};
var queue = [];
var isFlushPending = false;
var queueJobs = function (job) {
    if (!queue.includes(job)) {
        queue.push(job);
    }
    queueFlush();
};
var queueFlush = function () {
    if (isFlushPending)
        return;
    isFlushPending = true;
    nextTick(flushJobs);
};
var flushJobs = function () {
    isFlushPending = false;
    var job;
    while ((job = queue.shift())) {
        job && job();
    }
};

function createRenderer(options) {
    var hostCreateElement = options.createElement, hostPatchProp = options.patchProp, hostInsert = options.insert, hostRemove = options.remove, hostSetElementText = options.setElementText;
    function render(vnode, container) {
        patch(null, vnode, container, null, null);
    }
    function patch(n1, n2, container, parentComponent, anchor) {
        var type = n2.type;
        switch (type) {
            case Fragment:
                processFragment(n1, n2, container, parentComponent, anchor);
                break;
            case Text:
                processText(n1, n2, container);
                break;
            default:
                if (n2.shapeFlags & 1 /* ELEMENT */) {
                    processElement(n1, n2, container, parentComponent, anchor);
                }
                else if (n2.shapeFlags & 2 /* STATEFUL_COMPONENT */) {
                    processComponent(n1, n2, container, parentComponent, anchor);
                }
                break;
        }
    }
    /**
     *
     * 处理text节点
     * @param n2
     * @param container
     */
    function processText(n1, n2, container) {
        var children = n2.children;
        var textNode = (n2.el = document.createTextNode(children));
        container.append(textNode);
    }
    /**
     * 处理fragment
     *
     * @param n2
     * @param container
     */
    function processFragment(n1, n2, container, parentComponent, anchor) {
        mountChildren(n2.children, container, parentComponent, anchor);
    }
    /**
     * 处理element节点
     *
     * @param n2
     * @param container
     */
    function processElement(n1, n2, container, parentComponent, anchor) {
        if (!n1) {
            mountElement(n2, container, parentComponent, anchor);
        }
        else {
            patchElement(n1, n2, container, parentComponent, anchor);
        }
    }
    function patchElement(n1, n2, container, parentComponent, anchor) {
        // update
        console.log("patchElement");
        var prevProps = n1.props || {};
        var nextProps = n2.props || {};
        var el = (n2.el = n1.el);
        patchChildren(n1, n2, el, parentComponent, anchor);
        patchProps(el, prevProps, nextProps);
    }
    function patchChildren(n1, n2, container, parentComponent, anchor) {
        console.log("patchChildren");
        var prevShapeFlags = n1.shapeFlags;
        var c1 = n1.children;
        var shapeFlags = n2.shapeFlags;
        var c2 = n2.children;
        // 新的子节点是text
        if (shapeFlags & 4 /* TEXT_CHILDREN */) {
            // 老的子字节的是array
            if (prevShapeFlags & 8 /* ARRAY_CHILDREN */) {
                // 1. 删除老的子节点
                unmountChildren(n1.children);
            }
            // 设置节点为text
            if (c1 !== c2) {
                hostSetElementText(container, c2);
            }
        }
        else {
            // 新的子节点必定是array
            // 老的子节点是text
            if (prevShapeFlags & 4 /* TEXT_CHILDREN */) {
                hostSetElementText(container, "");
                mountChildren(c2, container, parentComponent, anchor);
            }
            else {
                // array diff array
                patchKeyedChildren(c1, c2, container, parentComponent, anchor);
            }
        }
    }
    function patchKeyedChildren(c1, c2, container, parentComponent, parentAnchor) {
        var i = 0;
        var l2 = c2.length;
        var e1 = c1.length - 1;
        var e2 = l2 - 1;
        var isSomeVNodeType = function (n1, n2) {
            return n1.type === n2.type && n1.key === n2.key;
        };
        // 左侧开始
        while (i <= e1 && i <= e2) {
            var n1 = c1[i];
            var n2 = c2[i];
            if (isSomeVNodeType(n1, n2)) {
                patch(n1, n2, container, parentComponent, parentAnchor);
            }
            else {
                break;
            }
            i++;
        }
        // 右侧开始
        while (i <= e1 && i <= e2) {
            var n1 = c1[e1];
            var n2 = c2[e2];
            if (isSomeVNodeType(n1, n2)) {
                patch(n1, n2, container, parentComponent, parentAnchor);
            }
            else {
                break;
            }
            e1--;
            e2--;
        }
        // 两端对比后
        if (i > e1) {
            if (i <= e2) {
                // add
                var nextPos = i + 1;
                // 锚点计算 如果是右侧多 则在新节点后面添加 null 如果左侧多 则在新节点最前面插入
                var anchor = nextPos < l2 ? c2[nextPos].el : null;
                while (i <= e2) {
                    patch(null, c2[i], container, parentComponent, anchor);
                    i++;
                }
            }
        }
        else if (i > e2) {
            // 新节点比老节点少，则删除老节点
            // delete
            while (i <= e1) {
                hostRemove(c1[i].el);
                i++;
            }
        }
        else {
            // 中间乱序的部分
            var s1 = i;
            var s2 = i;
            var toBePatched = e2 - s2 + 1;
            var patched = 0;
            // 新节点key对应在新节点中的索引位置
            var keyToNewIndexMap = new Map();
            for (var i_1 = s2; i_1 <= e2; i_1++) {
                var nextChild = c2[i_1];
                keyToNewIndexMap.set(nextChild.key, i_1);
            }
            // 新节点索引 对应 老节点中的索引位置  从中间乱序开始 所以长度为toBePatched
            var newIndexToOldIndexMap = new Array(toBePatched);
            for (var i_2 = 0; i_2 < toBePatched; i_2++)
                newIndexToOldIndexMap[i_2] = 0;
            var moved = false;
            // 用来存储上一个新节点的位置
            var maxNewIndexSoFar = 0;
            for (var i_3 = s1; i_3 <= e1; i_3++) {
                var pervChild = c1[i_3];
                // 删除多余的旧节点
                if (patched >= toBePatched) {
                    hostRemove(pervChild.el);
                    continue;
                }
                var newIndex = void 0;
                // null undefined
                // 存在key
                if (pervChild.key !== null) {
                    newIndex = keyToNewIndexMap.get(pervChild.key);
                }
                else {
                    // 不存在就遍历
                    for (var j_1 = s2; j_1 <= e2; j_1++) {
                        if (isSomeVNodeType(pervChild, c2[j_1])) {
                            newIndex = j_1;
                            break;
                        }
                    }
                }
                // 新节点里面找不到 就删除
                if (newIndex === undefined) {
                    hostRemove(pervChild.el);
                }
                else {
                    //  只要判定 在新节点中不连续 就需要移动
                    if (maxNewIndexSoFar <= newIndex) {
                        maxNewIndexSoFar = newIndex;
                    }
                    else {
                        moved = true;
                    }
                    // 存储 新节点在老节点中的位置
                    // 之所以要加1 是因为后续能够判断新增节点  虽然加了1 但是最长子序列的计算结果不会发生变化 因为计算的是位置
                    newIndexToOldIndexMap[newIndex - s2] = i_3 + 1;
                    // 存在 就patch
                    patch(pervChild, c2[newIndex], container, parentComponent, null);
                    // 记录匹配数  用来删除多余的旧节点
                    patched++;
                }
            }
            // 在patch之后，还存在位置不一致 或者 多节点的情况
            // 所以需要移动 和新增
            // 求出最长递增子序列
            var increasingNewIndexSequence = moved
                ? getSequence(newIndexToOldIndexMap)
                : [];
            var j = increasingNewIndexSequence.length - 1;
            // 之所以倒叙 因为插入的时候确定锚点的时候  后面的锚点是确定不会在变化的
            for (var i_4 = toBePatched - 1; i_4 >= 0; i_4--) {
                var newIndex = s2 + i_4;
                var nextChild = c2[newIndex];
                var anchor = newIndex + 1 < l2 ? c2[newIndex + 1].el : null;
                // 在老节点当中不存在 就需要新增 所以我们直接判断初始化数据是否为0即可
                if (newIndexToOldIndexMap[i_4] === 0) {
                    patch(null, nextChild, container, parentComponent, anchor);
                }
                else if (moved) {
                    if (j < 0 || j !== increasingNewIndexSequence[i_4]) {
                        // 需要移动
                        hostInsert(nextChild.el, container, anchor);
                    }
                    else {
                        // 不需要移动则进行下一个对比
                        j--;
                    }
                }
            }
        }
    }
    /**
     * 删除子节点
     * * @param children
     */
    function unmountChildren(children) {
        for (var i = 0; i < children.length; i++) {
            var el = children[i].el;
            hostRemove(el);
        }
    }
    /**
     * 变更属性
     *
     * @param el
     * @param oldProps
     * @param newProps
     */
    function patchProps(el, oldProps, newProps) {
        console.log("patchProps");
        if (oldProps !== newProps) {
            for (var key in newProps) {
                var oldProp = oldProps[key];
                var newProp = newProps[key];
                if (newProp !== oldProp) {
                    hostPatchProp(el, key, oldProp, newProp);
                }
            }
            if (oldProps) {
                // 老节点存在 新节点不存在
                for (var key in oldProps) {
                    if (!newProps[key]) {
                        hostPatchProp(el, key, oldProps[key], null);
                    }
                }
            }
        }
    }
    function mountElement(vnode, container, parentComponent, anchor) {
        var el = (vnode.el = hostCreateElement(vnode.type));
        var props = vnode.props, children = vnode.children, shapeFlags = vnode.shapeFlags;
        for (var key in props) {
            var val = props[key];
            hostPatchProp(el, key, null, val);
        }
        // children
        if (shapeFlags & 4 /* TEXT_CHILDREN */) {
            el.textContent = children;
        }
        else if (shapeFlags & 8 /* ARRAY_CHILDREN */) {
            mountChildren(vnode.children, el, parentComponent, anchor);
        }
        hostInsert(el, container, anchor);
    }
    function mountChildren(children, container, parentComponent, anchor) {
        children.forEach(function (v) {
            patch(null, v, container, parentComponent, anchor);
        });
    }
    /**
     * 处理component
     *
     * @param n2
     * @param container
     */
    function processComponent(n1, n2, container, parentComponent, anchor) {
        if (!n1) {
            mountComponent(n2, container, parentComponent, anchor);
        }
        else {
            updateComponent(n1, n2);
        }
    }
    function updateComponent(n1, n2) {
        var instance = (n2.component = n1.component);
        if (shouldUpdateComponent(n1, n2)) {
            // next 存储新的vnode
            instance.next = n2;
            instance.update();
        }
        else {
            n2.el = n1.el;
            instance.vnode = n2;
        }
    }
    function mountComponent(vnode, container, parentComponent, anchor) {
        var instance = (vnode.component = createComponentInstance(vnode, parentComponent));
        setupComponent(instance);
        setupRenderEffect(instance, container, anchor);
    }
    function setupRenderEffect(instance, container, anchor) {
        instance.update = effect(function () {
            if (!instance.isMounted) {
                var subTree = instance.render.call(instance.proxy);
                patch(null, subTree, container, instance, anchor);
                instance.vnode.el = subTree.el;
                instance.subTree = subTree;
                instance.isMounted = true;
            }
            else {
                console.log("update");
                var next = instance.next, vnode = instance.vnode;
                if (next) {
                    next.el = vnode.el;
                    updateComponentPreRender(instance, next);
                }
                var prevTree = instance.subTree;
                var nextTree = instance.render.call(instance.proxy);
                instance.subTree = nextTree;
                patch(prevTree, nextTree, container, instance, anchor);
            }
        }, {
            scheduler: function () {
                queueJobs(instance.update);
            },
        });
    }
    // 组件更新主要就是更新数据 -> props
    function updateComponentPreRender(instance, next) {
        instance.vnode = next;
        instance.next = null;
        instance.props = next.props;
    }
    return {
        createApp: createAppAPI(render),
    };
}
// TODO 后续自己来写一些 这个是从网上找的
function getSequence(nums) {
    var n = nums.length;
    if (n <= 1) {
        return n;
    }
    var tail = [nums[0]]; //存放最长上升子序列数组
    for (var i = 0; i < n; i++) {
        if (nums[i] > tail[tail.length - 1]) {
            //当nums中的元素比tail中的最后一个大时 可以放心push进tail
            tail.push(nums[i]);
        }
        else {
            //否则进行二分查找
            var left = 0;
            var right = tail.length - 1;
            while (left < right) {
                var mid = (left + right) >> 1;
                if (tail[mid] < nums[i]) {
                    left = mid + 1;
                }
                else {
                    right = mid;
                }
            }
            tail[left] = nums[i]; //将nums[i]放置到合适的位置，此时前面的元素都比nums[i]小
        }
    }
    return tail;
}

function renderSlots(slots, name, props) {
    var slot = slots[name];
    if (slot) {
        if (typeof slot === "function") {
            return createVNode(Fragment, {}, slot(props));
        }
    }
}

function h(type, props, children) {
    return createVNode(type, props, children);
}

function provide(key, value) {
    var currentInstance = getCurrentInstance();
    if (currentInstance) {
        var provides = currentInstance.provides;
        // 之所以这里有一个判断 是因为在app层级的时候 是没有父级的
        var parentProvides = currentInstance.parent
            ? currentInstance.parent.provides
            : {};
        if (provides === parentProvides) {
            provides = currentInstance.provides = Object.create(parentProvides);
        }
        provides[key] = value;
    }
}
function inject(key, defaultValue) {
    var currentInstance = getCurrentInstance();
    if (currentInstance) {
        var provides = currentInstance.provides;
        if (key in provides) {
            return provides[key];
        }
        else if (defaultValue) {
            if (typeof defaultValue === "function") {
                return defaultValue();
            }
            return defaultValue;
        }
    }
}

/**
 * 创建节点
 *
 * @param type
 * @returns
 */
function createElement(type) {
    return document.createElement(type);
}
/**
 * 设置prop
 *
 * @param el
 * @param key
 * @param nextVal
 */
function patchProp(el, key, prevVal, nextVal) {
    if (isOn(key)) {
        var event_1 = key.slice(2).toLowerCase();
        el.addEventListener(event_1, nextVal);
    }
    else {
        if (nextVal === undefined || nextVal === null) {
            el.removeAttribute(key);
        }
        else {
            el.setAttribute(key, nextVal);
        }
    }
}
/**
 * 添加节点
 *
 * @param el
 * @param parent
 */
function insert(child, parent, anchor) {
    // parent.append(el);
    parent.insertBefore(child, anchor || null);
}
/**
 * 删除元素
 *
 * @param el
 */
function remove(el) {
    var parent = el.parentNode;
    if (parent) {
        parent.removeChild(el);
    }
}
/**
 * 修改节点为文本
 *
 * @param el
 * @param text
 */
function setElementText(el, text) {
    el.textContent = text;
}
// TODO 更多的dom操作方法
var renderer = createRenderer({
    createElement: createElement,
    patchProp: patchProp,
    insert: insert,
    remove: remove,
    setElementText: setElementText,
});
function createApp() {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
    }
    // 这里有点绕  这里调用的实际是crateApp.ts中createAppAPI中的createApp
    // renderer = { createApp: createAppAPI = { createApp }  }
    return renderer.createApp.apply(renderer, __spreadArray([], __read(args), false));
}

// Ref 实现
var RefImpl = /** @class */ (function () {
    function RefImpl(value) {
        // ref 标识
        this.__v_isRef = true;
        this._value = convert(value);
        this._rawValue = value;
        this.dep = new Set();
    }
    Object.defineProperty(RefImpl.prototype, "value", {
        get: function () {
            trackRefValue(this);
            return this._value;
        },
        set: function (val) {
            // 有变化就赋值
            if (hasChanged(this._rawValue, val)) {
                this._value = convert(val);
                this._rawValue = val;
                triggerEffects(this.dep);
            }
        },
        enumerable: false,
        configurable: true
    });
    /**
     * 判断是否需要收集
     * 如果value是一个对象 就交给了reactive处理 就不需要本身的dep来进行依赖收集了
     *
     * @returns
     */
    RefImpl.prototype.shouldTrack = function () {
        return !isObject(this._rawValue);
    };
    return RefImpl;
}());
/**
 * 创建单值的响应式
 *
 * @param value
 * @returns
 */
function ref(value) {
    return new RefImpl(value);
}
/**
 *
 * 针对对象中存在ref的处理
 *
 * @param raw
 * @returns
 */
function proxyRefs(raw) {
    return new Proxy(raw, {
        get: function (target, key) {
            var res = Reflect.get(target, key);
            // 解构出原值
            return unRef(res);
        },
        set: function (target, key, newValue) {
            var res = Reflect.get(target, key);
            // 本身是一个ref但是设置的值不是ref类型
            if (isRef(res) && !isRef(newValue)) {
                return (res.value = newValue);
            }
            else {
                return Reflect.set(target, key, newValue);
            }
        },
    });
}
/**
 * 判断是否是一个ref类型
 *
 * @param ref
 * @returns
 */
function isRef(ref) {
    return ref && !!ref.__v_isRef;
}
/**
 * 解析出ref中的值
 *
 * @param ref
 * @returns
 */
function unRef(ref) {
    return isRef(ref) ? ref.value : ref;
}
/**
 * 根据值得类型转化为响应式的值或者原始值
 *
 * @param value
 * @returns
 */
function convert(value) {
    return isObject(value) ? reactive(value) : value;
}
/**
 * ref的依赖收集
 *
 * @param ref
 */
function trackRefValue(ref) {
    if (isTracking() && ref.shouldTrack()) {
        trackEffects(ref.dep);
    }
}

export { createApp, createRenderer, createTextVNode, getCurrentInstance, h, inject, nextTick, provide, proxyRefs, ref, renderSlots };
