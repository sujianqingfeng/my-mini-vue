var extend = Object.assign;
// 判断是否为一个对象
var isObject = function (value) { return value !== null && typeof value === "object"; };
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

// 存放依赖的map
var targetMap = new Map();
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

function createComponentInstance(vnode) {
    var instance = {
        vnode: vnode,
        type: vnode.type,
        setupState: {},
        props: undefined,
        slots: {},
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
        var emit_1 = instance.emit.bind(null, instance);
        var setupResult = setup(shallowReadonly(instance.props), { emit: emit_1 });
        handleSetupResult(instance, setupResult);
    }
}
function handleSetupResult(instance, setupResult) {
    // 返回对象
    if (typeof setupResult === "object") {
        instance.setupState = setupResult;
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

function render(vnode, container) {
    patch(vnode, container);
}
function patch(vnode, container) {
    if (vnode.shapeFlags & 1 /* ELEMENT */) {
        processElement(vnode, container);
    }
    else if (vnode.shapeFlags & 2 /* STATEFUL_COMPONENT */) {
        processComponent(vnode, container);
    }
}
/**
 * 处理element节点
 *
 * @param vnode
 * @param container
 */
function processElement(vnode, container) {
    mountElement(vnode, container);
}
function mountElement(vnode, container) {
    var el = (vnode.el = document.createElement(vnode.type));
    var props = vnode.props, children = vnode.children, shapeFlags = vnode.shapeFlags;
    for (var key in props) {
        var val = props[key];
        if (isOn(key)) {
            var event_1 = key.slice(2).toLowerCase();
            el.addEventListener(event_1, val);
        }
        else {
            el.setAttribute(key, val);
        }
    }
    // children
    if (shapeFlags & 4 /* TEXT_CHILDREN */) {
        el.textContent = children;
    }
    else if (shapeFlags & 8 /* ARRAY_CHILDREN */) {
        mountChildren(children, el);
    }
    container.append(el);
}
function mountChildren(vnodes, container) {
    vnodes.forEach(function (v) {
        patch(v, container);
    });
}
/**
 * 处理component
 *
 * @param vnode
 * @param container
 */
function processComponent(vnode, container) {
    mountComponent(vnode, container);
}
function mountComponent(vnode, container) {
    var instance = createComponentInstance(vnode);
    setupComponent(instance);
    setupRenderEffect(instance, container);
}
function setupRenderEffect(instance, container) {
    var subTree = instance.render.call(instance.proxy);
    patch(subTree, container);
    instance.vnode.el = subTree.el;
}

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
function getShapeFlags(type) {
    return typeof type === "string"
        ? 1 /* ELEMENT */
        : 2 /* STATEFUL_COMPONENT */;
}

function createApp(rootComponent) {
    return {
        mount: function (rootContainer) {
            var vnode = createVNode(rootComponent);
            render(vnode, rootContainer);
        },
    };
}

function renderSlots(slots, name, props) {
    var slot = slots[name];
    if (slot) {
        if (typeof slot === "function") {
            return createVNode("div", {}, slot(props));
        }
    }
}

function h(type, props, children) {
    return createVNode(type, props, children);
}

export { createApp, h, renderSlots };
