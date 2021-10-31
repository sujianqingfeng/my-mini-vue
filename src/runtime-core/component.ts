import { emit } from "./componentEmit";
import { shallowReadonly } from "../reactivity/reactive";
import { initProps } from "./componentProps";
import { componentPublicHandler } from "./componentPublicInstance";
import { initSlots } from "./componentSlots";

export function createComponentInstance(vnode) {
  const instance = {
    vnode,
    type: vnode.type,
    setupState: {},
    props: undefined,
    slots: {},
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
    const emit = instance.emit.bind(null, instance);
    const setupResult = setup(shallowReadonly(instance.props), { emit });
    handleSetupResult(instance, setupResult);
  }
}
function handleSetupResult(instance, setupResult: any) {
  // 返回对象
  if (typeof setupResult === "object") {
    instance.setupState = setupResult;
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
