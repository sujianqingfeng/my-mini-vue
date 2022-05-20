'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function toDisplayString(value) {
    return String(value);
}

const extend = Object.assign;
// 判断是否为一个对象
const isObject = (value) => value !== null && typeof value === "object";
const isString = (value) => typeof value === "string";
const hasChanged = (value, newValue) => !Object.is(value, newValue);
const hasOwn = (target, key) => Object.prototype.hasOwnProperty.call(target, key);
/**
 * 判断字符串开头存在on
 *
 * @param key
 * @returns
 */
const isOn = (key) => /^on[A-Z]/.test(key);
/**
 * 处理 xx-xx  形式的格式 变为 xxXx 格式
 *
 * @param str
 * @returns
 */
const camelize = (str) => {
    return str.replace(/-(\w)/g, (_, c) => {
        return c ? c.toUpperCase() : "";
    });
};
const capitalize = (str) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
};
const toHandleKey = (str) => {
    return str ? "on" + capitalize(str) : "";
};

const createDep = (effects) => {
    const dep = new Set(effects);
    return dep;
};

// 全局变量 用来存放 当前effect
let activeEffect;
// 是否应该被收集
let shouldTrack = true;
// 存放依赖的map
const targetMap = new WeakMap();
/**
 * 存储副作用函数
 */
class ReactiveEffect {
    constructor(fn, scheduler = null) {
        this.fn = fn;
        this.scheduler = scheduler;
        this.deps = [];
        this.active = true;
    }
    run() {
        // stop 下的状态 不用收集依赖
        if (!this.active) {
            return this.fn();
        }
        // 保存当前执行的fn
        activeEffect = this;
        // 设置需要收集标识
        shouldTrack = true;
        // 执行fn的时候 就会访问响应式数据中的get 从而触发依赖收集
        const result = this.fn();
        // 重置需要收集标识  以防收集到不需要收集的依赖
        shouldTrack = false;
        return result;
    }
    stop() {
        // 如果没有停止过
        if (this.active) {
            clearUpEffect(this);
            // 存在onStop回调就执行
            this.onStop && this.onStop();
            // 设置停止标识
            this.active = false;
        }
    }
}
/**
 *
 * 创建effect
 *
 * @param fn
 * @param options
 * @returns
 */
function effect(fn, options) {
    const _effect = new ReactiveEffect(fn);
    // 把一些可选项挂到 effect实例上 比如scheduler、onStop
    extend(_effect, options);
    // 执行fn
    _effect.run();
    // effect函数要返回可对fn执行的函数 并不是fn本身
    const runner = _effect.run.bind(_effect);
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
    // 判断需要收集
    if (shouldTrack && activeEffect) {
        // 取出存放依赖的容器dep
        let depsMap = targetMap.get(target);
        if (!depsMap) {
            targetMap.set(target, (depsMap = new Map()));
        }
        let dep = depsMap.get(key);
        if (!dep) {
            depsMap.set(key, (dep = createDep()));
        }
        // 开始收集
        trackEffects(dep);
    }
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
    const depsMap = targetMap.get(target);
    if (!depsMap) {
        return;
    }
    const dep = depsMap.get(key);
    if (dep) {
        // 执行依赖
        triggerEffects(dep);
    }
}
/**
 * 抽离触发依赖 ref要用
 *
 * @param dep
 */
function triggerEffects(dep) {
    // 如果依赖被设置过scheduler就执行scheduler
    for (const effect of dep) {
        if (effect.scheduler) {
            effect.scheduler();
        }
        else {
            effect.run();
        }
    }
}
/**
 * 清空依赖
 *
 * @param effect
 */
function clearUpEffect(effect) {
    effect.deps.forEach((dep) => {
        // dep 是一个set
        dep.delete(effect);
    });
}

// 全局变量  只执行一次
const get = createGetter();
const set = createSetter();
const readonlyGet = createGetter(true);
const shallowReadonlyGet = createGetter(true, true);
/**
 * 创建get 函数
 *
 * @param isReadonly
 * @param shallow
 * @returns
 */
function createGetter(isReadonly = false, shallow = false) {
    return function get(target, key, receiver) {
        if (key === ReactiveFlags.IS_REACTIVE) {
            return !isReadonly;
        }
        else if (key === ReactiveFlags.IS_READONLY) {
            return isReadonly;
        }
        const res = Reflect.get(target, key, receiver);
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
        const res = Reflect.set(targe, key, value);
        trigger(targe, key);
        return res;
    };
}
/**
 * 变化的 proxy handles
 */
const mutableHandles = {
    get,
    set,
};
/**
 * 可读取的proxy handles
 */
const readonlyHandles = {
    get: readonlyGet,
    set: function (target, key, value) {
        console.warn(`readonly not call set ,target:${target},key:${key},value:${value}`);
        // JavaScript 强制执行某些不变量 — 内部方法和捕捉器必须满足的条件。
        // set 方法必须返回 true 或者 false
        return true;
    },
};
/**
 * 表层可读的proxy handles
 */
const shallowReadonlyHandles = extend({}, readonlyHandles, {
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
/**
 * 根据值得类型转化为响应式的值或者原始值
 *
 * @param value
 * @returns
 */
function toReactive(value) {
    return isObject(value) ? reactive(value) : value;
}

// Ref 实现
class RefImpl {
    constructor(value) {
        /**
         * 依赖容器
         */
        this.dep = undefined;
        // ref 标识
        this.__v_isRef = true;
        this._rawValue = value;
        this._value = toReactive(value);
        this.dep = new Set();
    }
    get value() {
        trackRefValue(this);
        return this._value;
    }
    set value(val) {
        // 有变化就赋值
        if (hasChanged(this._rawValue, val)) {
            this._rawValue = val;
            this._value = toReactive(val);
            if (this.dep) {
                triggerEffects(this.dep);
            }
        }
    }
}
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
        get(target, key) {
            const res = Reflect.get(target, key);
            // 解构出原值
            return unRef(res);
        },
        set(target, key, newValue) {
            const res = Reflect.get(target, key);
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
 * @param r
 * @returns
 */
function isRef(r) {
    return !!(r && r.__v_isRef === true);
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
 * ref的依赖收集
 *
 * @param ref
 */
function trackRefValue(ref) {
    if (shouldTrack && activeEffect) {
        trackEffects(ref.dep || (ref.dep = createDep()));
    }
}

const emit = (instance, event, ...args) => {
    const { props } = instance;
    const handleName = toHandleKey(camelize(event));
    const handler = props[handleName];
    handler === null || handler === void 0 ? void 0 : handler(...args);
};

function initProps(instance, props) {
    instance.props = props || {};
}

const publicPropertiesMap = {
    $el: (i) => i.vnode.el,
    $slots: (i) => i.slots,
    $props: (i) => i.props,
};
const componentPublicHandler = {
    get({ _: instance }, key) {
        const { setupState, props } = instance;
        if (hasOwn(setupState, key)) {
            return setupState[key];
        }
        else if (hasOwn(props, key)) {
            return props[key];
        }
        const publicGetter = publicPropertiesMap[key];
        if (publicGetter) {
            return publicGetter(instance);
        }
    },
};

function initSlots(instance, children) {
    const { vnode } = instance;
    if (vnode.shapeFlags & 16 /* SLOT_CHILDREN */) {
        normalizeObjectSlots(children, instance.slots);
    }
}
function normalizeObjectSlots(children, slots) {
    for (const key in children) {
        // 取出fun
        const value = children[key];
        // 重新构建一个函数，用来传递参数
        slots[key] = (props) => normalizeSlotValue(value(props));
    }
}
function normalizeSlotValue(value) {
    return Array.isArray(value) ? value : [value];
}

function createComponentInstance(vnode, parent) {
    const instance = {
        vnode,
        next: null,
        type: vnode.type,
        setupState: {},
        props: undefined,
        parent,
        provides: parent ? parent.provides : {},
        slots: {},
        isMounted: false,
        subTree: {},
        emit: () => { },
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
    const Component = instance.type;
    // 组件代理
    instance.proxy = new Proxy({ _: instance }, componentPublicHandler);
    const { setup } = Component;
    if (setup) {
        setCurrentInstance(instance);
        const setupResult = setup(shallowReadonly(instance.props), {
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
    const Component = instance.type;
    if (compiler && !Component.render) {
        if (Component.template) {
            Component.render = compiler(Component.template);
        }
    }
    instance.render = Component.render;
}
let currentInstance = null;
function setCurrentInstance(instance) {
    currentInstance = instance;
}
function getCurrentInstance() {
    return currentInstance;
}
let compiler;
function registerRuntimeCompile(_compiler) {
    compiler = _compiler;
}

const Fragment = Symbol("Fragment");
const Text = Symbol("Text");
function createVNode(type, props, children) {
    const vnode = {
        type,
        props,
        children,
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
            mount(rootContainer) {
                const vnode = createVNode(rootComponent);
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
    const { props: prevProps } = prevVNode;
    const { props: nextProps } = nextVNode;
    for (const key in nextProps) {
        if (nextProps[key] !== prevProps[key]) {
            return true;
        }
    }
    return false;
}

const p = Promise.resolve();
const nextTick = (fn) => {
    return fn ? p.then(fn) : p;
};
const queue = [];
let isFlushPending = false;
const queueJobs = (job) => {
    if (!queue.includes(job)) {
        queue.push(job);
    }
    queueFlush();
};
const queueFlush = () => {
    if (isFlushPending)
        return;
    isFlushPending = true;
    nextTick(flushJobs);
};
const flushJobs = () => {
    isFlushPending = false;
    let job;
    while ((job = queue.shift())) {
        job && job();
    }
};

function createRenderer(options) {
    const { createElement: hostCreateElement, patchProp: hostPatchProp, insert: hostInsert, remove: hostRemove, setElementText: hostSetElementText, } = options;
    function render(vnode, container) {
        patch(null, vnode, container, null, null);
    }
    function patch(n1, n2, container, parentComponent, anchor) {
        const { type } = n2;
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
        const { children } = n2;
        const textNode = (n2.el = document.createTextNode(children));
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
        const prevProps = n1.props || {};
        const nextProps = n2.props || {};
        const el = (n2.el = n1.el);
        patchChildren(n1, n2, el, parentComponent, anchor);
        patchProps(el, prevProps, nextProps);
    }
    function patchChildren(n1, n2, container, parentComponent, anchor) {
        console.log("patchChildren");
        const prevShapeFlags = n1.shapeFlags;
        const c1 = n1.children;
        const { shapeFlags } = n2;
        const c2 = n2.children;
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
        let i = 0;
        const l2 = c2.length;
        let e1 = c1.length - 1;
        let e2 = l2 - 1;
        const isSomeVNodeType = (n1, n2) => {
            return n1.type === n2.type && n1.key === n2.key;
        };
        // 左侧开始
        while (i <= e1 && i <= e2) {
            const n1 = c1[i];
            const n2 = c2[i];
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
            const n1 = c1[e1];
            const n2 = c2[e2];
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
                const nextPos = i + 1;
                // 锚点计算 如果是右侧多 则在新节点后面添加 null 如果左侧多 则在新节点最前面插入
                const anchor = nextPos < l2 ? c2[nextPos].el : null;
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
            const s1 = i;
            const s2 = i;
            const toBePatched = e2 - s2 + 1;
            let patched = 0;
            // 新节点key对应在新节点中的索引位置
            const keyToNewIndexMap = new Map();
            for (let i = s2; i <= e2; i++) {
                const nextChild = c2[i];
                keyToNewIndexMap.set(nextChild.key, i);
            }
            // 新节点索引 对应 老节点中的索引位置  从中间乱序开始 所以长度为toBePatched
            const newIndexToOldIndexMap = new Array(toBePatched);
            for (let i = 0; i < toBePatched; i++)
                newIndexToOldIndexMap[i] = 0;
            let moved = false;
            // 用来存储上一个新节点的位置
            let maxNewIndexSoFar = 0;
            for (let i = s1; i <= e1; i++) {
                const pervChild = c1[i];
                // 删除多余的旧节点
                if (patched >= toBePatched) {
                    hostRemove(pervChild.el);
                    continue;
                }
                let newIndex;
                // null undefined
                // 存在key
                if (pervChild.key !== null) {
                    newIndex = keyToNewIndexMap.get(pervChild.key);
                }
                else {
                    // 不存在就遍历
                    for (let j = s2; j <= e2; j++) {
                        if (isSomeVNodeType(pervChild, c2[j])) {
                            newIndex = j;
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
                    newIndexToOldIndexMap[newIndex - s2] = i + 1;
                    // 存在 就patch
                    patch(pervChild, c2[newIndex], container, parentComponent, null);
                    // 记录匹配数  用来删除多余的旧节点
                    patched++;
                }
            }
            // 在patch之后，还存在位置不一致 或者 多节点的情况
            // 所以需要移动 和新增
            // 求出最长递增子序列
            const increasingNewIndexSequence = moved
                ? getSequence(newIndexToOldIndexMap)
                : [];
            let j = increasingNewIndexSequence.length - 1;
            // 之所以倒叙 因为插入的时候确定锚点的时候  后面的锚点是确定不会在变化的
            for (let i = toBePatched - 1; i >= 0; i--) {
                const newIndex = s2 + i;
                const nextChild = c2[newIndex];
                const anchor = newIndex + 1 < l2 ? c2[newIndex + 1].el : null;
                // 在老节点当中不存在 就需要新增 所以我们直接判断初始化数据是否为0即可
                if (newIndexToOldIndexMap[i] === 0) {
                    patch(null, nextChild, container, parentComponent, anchor);
                }
                else if (moved) {
                    if (j < 0 || j !== increasingNewIndexSequence[i]) {
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
        for (let i = 0; i < children.length; i++) {
            const el = children[i].el;
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
            for (const key in newProps) {
                const oldProp = oldProps[key];
                const newProp = newProps[key];
                if (newProp !== oldProp) {
                    hostPatchProp(el, key, oldProp, newProp);
                }
            }
            if (oldProps) {
                // 老节点存在 新节点不存在
                for (const key in oldProps) {
                    if (!newProps[key]) {
                        hostPatchProp(el, key, oldProps[key], null);
                    }
                }
            }
        }
    }
    function mountElement(vnode, container, parentComponent, anchor) {
        const el = (vnode.el = hostCreateElement(vnode.type));
        const { props, children, shapeFlags } = vnode;
        for (const key in props) {
            const val = props[key];
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
        children.forEach((v) => {
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
        const instance = (n2.component = n1.component);
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
        const instance = (vnode.component = createComponentInstance(vnode, parentComponent));
        setupComponent(instance);
        setupRenderEffect(instance, container, anchor);
    }
    function setupRenderEffect(instance, container, anchor) {
        instance.update = effect(() => {
            if (!instance.isMounted) {
                const { proxy } = instance;
                const subTree = instance.render.call(proxy, proxy);
                patch(null, subTree, container, instance, anchor);
                instance.vnode.el = subTree.el;
                instance.subTree = subTree;
                instance.isMounted = true;
            }
            else {
                console.log("update");
                const { next, vnode, proxy } = instance;
                if (next) {
                    next.el = vnode.el;
                    updateComponentPreRender(instance, next);
                }
                const prevTree = instance.subTree;
                const nextTree = instance.render.call(proxy, proxy);
                instance.subTree = nextTree;
                patch(prevTree, nextTree, container, instance, anchor);
            }
        }, {
            scheduler() {
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
    let n = nums.length;
    if (n <= 1) {
        return n;
    }
    let tail = [nums[0]]; //存放最长上升子序列数组
    for (let i = 0; i < n; i++) {
        if (nums[i] > tail[tail.length - 1]) {
            //当nums中的元素比tail中的最后一个大时 可以放心push进tail
            tail.push(nums[i]);
        }
        else {
            //否则进行二分查找
            let left = 0;
            let right = tail.length - 1;
            while (left < right) {
                let mid = (left + right) >> 1;
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
    const slot = slots[name];
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
    const currentInstance = getCurrentInstance();
    if (currentInstance) {
        let { provides } = currentInstance;
        // 之所以这里有一个判断 是因为在app层级的时候 是没有父级的
        const parentProvides = currentInstance.parent
            ? currentInstance.parent.provides
            : {};
        if (provides === parentProvides) {
            provides = currentInstance.provides = Object.create(parentProvides);
        }
        provides[key] = value;
    }
}
function inject(key, defaultValue) {
    const currentInstance = getCurrentInstance();
    if (currentInstance) {
        const { provides } = currentInstance;
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
        const event = key.slice(2).toLowerCase();
        el.addEventListener(event, nextVal);
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
    const parent = el.parentNode;
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
const renderer = createRenderer({
    createElement,
    patchProp,
    insert,
    remove,
    setElementText,
});
function createApp(...args) {
    // 这里有点绕  这里调用的实际是crateApp.ts中createAppAPI中的createApp
    // renderer = { createApp: createAppAPI = { createApp }  }
    return renderer.createApp(...args);
}

var runtimeDom = /*#__PURE__*/Object.freeze({
    __proto__: null,
    createApp: createApp,
    createRenderer: createRenderer,
    renderSlots: renderSlots,
    createTextVNode: createTextVNode,
    createElementVNode: createVNode,
    getCurrentInstance: getCurrentInstance,
    registerRuntimeCompile: registerRuntimeCompile,
    h: h,
    provide: provide,
    inject: inject,
    nextTick: nextTick,
    toDisplayString: toDisplayString,
    ref: ref,
    proxyRefs: proxyRefs
});

const TO_DISPLAY_STRING = Symbol("toDisplayString");
const CREATE_ELEMENT_VNODE = Symbol("createElementVNode");
/**
 * 函数名映射
 *
 */
const helperMapName = {
    [TO_DISPLAY_STRING]: "toDisplayString",
    [CREATE_ELEMENT_VNODE]: "createElementVNode",
};

/**
 * 生成代码
 *
 * @param ast
 * @returns
 */
function generate(ast) {
    const context = createCodegenContext();
    const { push } = context;
    genFunctionPreamble(ast, context);
    const functionName = "render";
    const args = ["_ctx", "_cache"];
    const signature = args.join(",");
    push(`function ${functionName}(${signature}) {`);
    push("return ");
    genNode(ast.codegenNode, context);
    push("}");
    return {
        code: context.code,
    };
}
/**
 * 添加导入方法的代码
 *
 * @param ast
 * @param context
 */
function genFunctionPreamble(ast, context) {
    // 生成类似 const { toDisplayString: _toDisplayString } = Vue
    const { push } = context;
    const VueBinging = "Vue";
    const aliasHelper = (s) => `${helperMapName[s]}:_${helperMapName[s]}`;
    if (ast.helpers.length) {
        push(`const { ${ast.helpers.map(aliasHelper).join(",")} } = ${VueBinging}`);
    }
    push("\n");
    push("return ");
}
/**
 * 生成节点
 *
 * @param ast
 * @param context
 */
function genNode(node, context) {
    switch (node.type) {
        case 3 /* TEXT */:
            genText(node, context);
            break;
        case 0 /* INTERPOLATION */:
            genInterpolation(node, context);
            break;
        case 1 /* SIMPLE_EXPRESSION */:
            genExpression(node, context);
            break;
        case 2 /* ELEMENT */:
            genElement(node, context);
            break;
        case 5 /* COMPOUND_EXPRESSION */:
            genCompoundExpression(node, context);
            break;
    }
}
/**
 * 生成复合类型的代码
 *
 *
 * @param node
 * @param context
 */
function genCompoundExpression(node, context) {
    const { children } = node;
    const { push } = context;
    for (let i = 0; i < children.length; i++) {
        const child = children[i];
        if (isString(child)) {
            push(child);
        }
        else {
            genNode(child, context);
        }
    }
}
function genElement(node, context) {
    const { push, helper } = context;
    const { tag, children, props } = node;
    push(`${helper(CREATE_ELEMENT_VNODE)}(`);
    const nullableNodes = genNullable([tag, props, children]);
    genNodeList(nullableNodes, context);
    push(")");
}
/**
 * 处理多个节点
 *
 * @param nodes
 * @param context
 */
function genNodeList(nodes, context) {
    const { push } = context;
    for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        if (isString(node)) {
            push(node);
        }
        else {
            genNode(node, context);
        }
        if (i < nodes.length - 1) {
            push(",");
        }
    }
}
/**
 * 处理虚值
 *
 * @param args
 * @returns
 */
function genNullable(args) {
    return args.map((arg) => arg || "null");
}
/**
 * 处理插值中表达式
 *
 * @param node
 * @param context
 */
function genExpression(node, context) {
    const { push } = context;
    push(node.content);
}
/**
 * 处理插值
 *
 * @param node
 * @param context
 */
function genInterpolation(node, context) {
    const { push, helper } = context;
    push(`${helper(TO_DISPLAY_STRING)}(`);
    genNode(node.content, context);
    push(")");
}
/**
 * 处理文本节点
 *
 * @param node
 * @param context
 */
function genText(node, context) {
    const { push } = context;
    push(`"${node.content}"`);
}
/**
 * 生成上下文 存储生成的代码已经工具函数
 *
 * @param ast
 * @returns
 */
function createCodegenContext(ast) {
    const context = {
        code: "",
        push: (source) => {
            context.code += source;
        },
        helper(key) {
            return `_${helperMapName[key]}`;
        },
    };
    return context;
}

function baseParse(content) {
    const context = createParseContext(content);
    return createRoot(parseChildren(context, []));
}
/**
 * 创建解析的上下文 按照一定格式存储数据
 *
 * @param content
 * @returns
 */
function createParseContext(content) {
    return {
        source: content,
    };
}
/**
 * 解析内容为子节点
 *
 * @param context
 * @returns
 */
function parseChildren(context, ancestors) {
    const nodes = [];
    while (!isEnd(context, ancestors)) {
        let node;
        const s = context.source;
        if (s.startsWith("{{")) {
            node = parseInterpolation(context);
        }
        else if (s[0] === "<") {
            if (/[a-z]/i.test(s[1])) {
                node = parseElement(context, ancestors);
            }
        }
        if (!node) {
            node = parseText(context);
        }
        nodes.push(node);
    }
    return nodes;
}
/**
 * children 解析完成标志
 *
 * @param context
 * @returns
 */
function isEnd(context, ancestors) {
    const s = context.source;
    if (s.startsWith("</")) {
        for (let i = 0; i < ancestors.length; i++) {
            const tag = ancestors[i].tag;
            if (startsWithEndTagOpen(s, tag)) {
                return true;
            }
        }
    }
    return !s;
}
/**
 * 解析text节点
 * * @param context
 * @returns
 */
function parseText(context) {
    let endIndex = context.source.length;
    const endTokens = ["{{", "<"];
    for (let i = 0; i < endTokens.length; i++) {
        const index = context.source.indexOf(endTokens[i]);
        if (index != -1 && index < endIndex) {
            endIndex = index;
        }
    }
    const content = parseTextData(context, endIndex);
    return {
        type: 3 /* TEXT */,
        content,
    };
}
/**
 * 解析text数据
 *
 * @param context
 * @param length
 * @returns
 */
function parseTextData(context, length) {
    const content = context.source.slice(0, length);
    advanceBy(context, length);
    return content;
}
/**
 * 解析element
 *
 * @param context
 * @returns
 */
function parseElement(context, ancestors) {
    const element = parseTag(context, 0 /* Start */);
    ancestors.push(element);
    // 注意顺序是在endTag之前
    element.children = parseChildren(context, ancestors);
    ancestors.pop();
    if (startsWithEndTagOpen(context.source, element.tag)) {
        parseTag(context, 1 /* End */);
    }
    else {
        throw new Error(`unclosed tag ${element.tag}`);
    }
    return element;
}
/**
 * 解析tag
 *
 * @param context
 * @param type
 * @returns
 */
function parseTag(context, type) {
    const match = /^<\/?([a-z]*)/i.exec(context.source);
    let tag = "";
    tag = match[1];
    advanceBy(context, match[0].length);
    advanceBy(context, 1);
    if (type === 1 /* End */) {
        return;
    }
    return {
        type: 2 /* ELEMENT */,
        tag,
    };
}
/**
 * 解析插值
 *
 * @param context
 * @returns
 */
function parseInterpolation(context) {
    const openDelimiter = "{{";
    const closeDelimiter = "}}";
    const closeIndex = context.source.indexOf(closeDelimiter, openDelimiter.length);
    advanceBy(context, openDelimiter.length);
    const rowContentLength = closeIndex - openDelimiter.length;
    const rowContent = parseTextData(context, rowContentLength);
    const content = rowContent.trim();
    advanceBy(context, closeDelimiter.length);
    return {
        type: 0 /* INTERPOLATION */,
        content: {
            type: 1 /* SIMPLE_EXPRESSION */,
            content,
        },
    };
}
/**
 * 截取内容
 *
 * @param context
 * @param length
 */
function advanceBy(context, length) {
    context.source = context.source.slice(length);
}
/**
 * 创建根节点
 *
 * @param children
 * @returns
 */
function createRoot(children) {
    return { children, type: 4 /* ROOT */ };
}
/**
 * 判断文本开头是否是传入的tag
 *
 * @param source
 * @param tag
 */
function startsWithEndTagOpen(source, tag) {
    return (source.startsWith("</") &&
        source.slice(2, 2 + tag.length).toLowerCase() === tag.toLowerCase());
}

function transform(root, options = {}) {
    const context = createTransformContext(root, options);
    traverseNode(root, context);
    createRootCodegen(root);
    root.helpers = [...context.helpers.keys()];
}
/**
 * 创建生成code的根节点
 *
 * @param root
 */
function createRootCodegen(root) {
    const child = root.children[0];
    if (child.type === 2 /* ELEMENT */) {
        root.codegenNode = child.codegenNode;
    }
    else {
        root.codegenNode = child;
    }
}
/**
 * 便利节点
 *
 * @param node
 * @param context
 */
function traverseNode(node, context) {
    // 执行处理函数
    const onExits = [];
    const { nodeTransforms } = context;
    for (let i = 0; i < nodeTransforms.length; i++) {
        const transform = nodeTransforms[i];
        const onExit = transform(node, context);
        // 如果返回的是一个函数，代表后执行
        if (onExit) {
            onExits.push(onExit);
        }
    }
    switch (node.type) {
        case 0 /* INTERPOLATION */:
            context.helper(TO_DISPLAY_STRING);
            break;
        case 4 /* ROOT */:
        case 2 /* ELEMENT */:
            // 遍历子节点
            traverseChildren(node, context);
            break;
    }
    // 后执行函数
    let i = onExits.length;
    while (i--) {
        onExits[i]();
    }
}
/**
 * 便利子节点
 *
 * @param node
 * @param context
 */
function traverseChildren(node, context) {
    const children = node.children;
    for (let i = 0; i < children.length; i++) {
        traverseNode(children[i], context);
    }
}
/**
 * 创建transform context
 *
 * @param root
 * @param options
 * @returns
 */
function createTransformContext(root, options) {
    const context = {
        root,
        nodeTransforms: options.nodeTransforms || [],
        helpers: new Map(),
        helper(key) {
            context.helpers.set(key, 1);
        },
    };
    return context;
}

/**
 * 创建Element辅助方法
 *
 * @param context
 * @param tag
 * @param props
 * @param children
 * @returns
 */
function createVNodeCall(context, tag, props, children) {
    context.helper(CREATE_ELEMENT_VNODE);
    return {
        type: 2 /* ELEMENT */,
        tag,
        props,
        children,
    };
}

function transformElement(node, context) {
    if (node.type === 2 /* ELEMENT */) {
        return () => {
            const { children, tag } = node;
            const vnodeTag = `"${tag}"`;
            const vnodeProps = undefined;
            const vnodeChildren = children[0];
            node.codegenNode = createVNodeCall(context, vnodeTag, vnodeProps, vnodeChildren);
        };
    }
}

/**
 * 处理插值类型 content 里面的内容
 *
 * @param node
 */
function transformExpression(node) {
    if (node.type === 0 /* INTERPOLATION */) {
        node.content = processExpression(node.content);
    }
}
function processExpression(node) {
    node.content = `_ctx.${node.content}`;
    return node;
}

function isText(node) {
    return node.type === 3 /* TEXT */ || node.type === 0 /* INTERPOLATION */;
}

// 将Text节点和插值节点 组合成一个新的复合节点
function transformText(node) {
    if (node.type === 2 /* ELEMENT */) {
        return () => {
            const { children } = node;
            let currentContainer;
            for (let i = 0; i < children.length; i++) {
                const child = children[i];
                if (isText(child)) {
                    for (let j = i + 1; j < children.length; j++) {
                        const next = children[j];
                        if (!currentContainer) {
                            currentContainer = children[i] = {
                                type: 5 /* COMPOUND_EXPRESSION */,
                                children: [child],
                            };
                        }
                        currentContainer.children.push(" + ");
                        currentContainer.children.push(next);
                        children.splice(j, 1);
                        j--;
                    }
                }
                else {
                    currentContainer = undefined;
                    break;
                }
            }
        };
    }
}

function baseCompile(template) {
    const ast = baseParse(template);
    transform(ast, {
        nodeTransforms: [transformExpression, transformElement, transformText],
    });
    return generate(ast);
}

function compileToFunction(template) {
    const { code } = baseCompile(template);
    // 这里记得要调用
    const render = new Function("Vue", code)(runtimeDom);
    return render;
}
registerRuntimeCompile(compileToFunction);

exports.compileToFunction = compileToFunction;
exports.createApp = createApp;
exports.createElementVNode = createVNode;
exports.createRenderer = createRenderer;
exports.createTextVNode = createTextVNode;
exports.getCurrentInstance = getCurrentInstance;
exports.h = h;
exports.inject = inject;
exports.nextTick = nextTick;
exports.provide = provide;
exports.proxyRefs = proxyRefs;
exports.ref = ref;
exports.registerRuntimeCompile = registerRuntimeCompile;
exports.renderSlots = renderSlots;
exports.toDisplayString = toDisplayString;
