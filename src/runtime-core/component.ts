import { emit } from "./componentEmit";
import { shallowReadonly } from "../reactivity/reactive";
import { initProps } from "./componentProps";
import { componentPublicHandler } from "./componentPublicInstance";
import { initSlots } from "./componentSlots";
import { proxyRefs } from "..";

export function createComponentInstance(vnode, parent) {
  const instance = {
    vnode,
    type: vnode.type,
    setupState: {},
    props: undefined,
    parent,
    provides: parent ? parent.provides : {},
    slots: {},
    isMounted: false,
    subTree: {},
    emit: () => {},
  };

  instance.emit = emit as any;

  return instance;
}

export function setupComponent(instance) {
  // initProps
  initProps(instance, instance.vnode.props);
  // initSlots
  initSlots(instance, instance.vnode.children);

  setupStatefulComponent(instance);
}

function setupStatefulComponent(instance: any) {
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
function handleSetupResult(instance, setupResult: any) {
  // 返回对象
  if (typeof setupResult === "object") {
    instance.setupState = proxyRefs(setupResult);
  }

  // TODO function

  finishComponentSetup(instance);
}

function finishComponentSetup(instance: any) {
  const Component = instance.type;

  if (!instance.render) {
    instance.render = Component.render;
  }
}

let currentInstance = null;

function setCurrentInstance(instance) {
  currentInstance = instance;
}

export function getCurrentInstance() {
  return currentInstance;
}
