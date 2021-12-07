'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

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

function createRenderer(options) {
    var hostCreateElement = options.createElement, hostPatchProp = options.patchProp, hostInsert = options.insert;
    function render(vnode, container) {
        patch(null, vnode, container, null);
    }
    function patch(n1, n2, container, parentComponent) {
        var type = n2.type;
        switch (type) {
            case Fragment:
                processFragment(n1, n2, container, parentComponent);
                break;
            case Text:
                processText(n1, n2, container);
                break;
            default:
                if (n2.shapeFlags & 1 /* ELEMENT */) {
                    processElement(n1, n2, container, parentComponent);
                }
                else if (n2.shapeFlags & 2 /* STATEFUL_COMPONENT */) {
                    processComponent(n1, n2, container, parentComponent);
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
    function processFragment(n1, n2, container, parentComponent) {
        mountChildren(n2, container, parentComponent);
    }
    /**
     * 处理element节点
     *
     * @param n2
     * @param container
     */
    function processElement(n1, n2, container, parent) {
        if (!n1) {
            mountElement(n2, container, parent);
        }
        else {
            patchElement(n1, n2);
        }
    }
    function patchElement(n1, n2, container) {
        // update
        console.log("patchElement");
        var prevProps = n1.props || {};
        var nextProps = n2.props || {};
        var el = (n2.el = n1.el);
        patchProps(el, prevProps, nextProps);
    }
    function patchProps(el, oldProps, newProps) {
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
    function mountElement(vnode, container, parentComponent) {
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
            mountChildren(vnode, el, parentComponent);
        }
        hostInsert(el, container);
    }
    function mountChildren(vnodes, container, parentComponent) {
        vnodes.children.forEach(function (v) {
            patch(null, v, container, parentComponent);
        });
    }
    /**
     * 处理component
     *
     * @param n2
     * @param container
     */
    function processComponent(n1, n2, container, parentComponent) {
        mountComponent(n2, container, parentComponent);
    }
    function mountComponent(vnode, container, parentComponent) {
        var instance = createComponentInstance(vnode, parentComponent);
        setupComponent(instance);
        setupRenderEffect(instance, container);
    }
    function setupRenderEffect(instance, container) {
        effect(function () {
            if (!instance.isMounted) {
                var subTree = instance.render.call(instance.proxy);
                patch(null, subTree, container, instance);
                instance.vnode.el = subTree.el;
                instance.subTree = subTree;
                instance.isMounted = true;
            }
            else {
                console.log("update");
                var prevTree = instance.subTree;
                var nextTree = instance.render.call(instance.proxy);
                instance.subTree = nextTree;
                patch(prevTree, nextTree, container, instance);
            }
        });
    }
    return {
        createApp: createAppAPI(render),
    };
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
function insert(el, parent) {
    parent.append(el);
}
// TODO 更多的dom操作方法
var renderer = createRenderer({ createElement: createElement, patchProp: patchProp, insert: insert });
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

exports.createApp = createApp;
exports.createRenderer = createRenderer;
exports.createTextVNode = createTextVNode;
exports.getCurrentInstance = getCurrentInstance;
exports.h = h;
exports.inject = inject;
exports.provide = provide;
exports.proxyRefs = proxyRefs;
exports.ref = ref;
exports.renderSlots = renderSlots;
