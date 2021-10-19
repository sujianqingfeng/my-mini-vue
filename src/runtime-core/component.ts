import { shallowReadonly } from "../reactivity/reactive";
import { initProps } from "./componentProps";
import { componentPublicHandler } from "./componentPublicInstance";

export function createComponentInstance(vnode) {
  const component = {
    vnode,
    type: vnode.type,
    setupState: {},
    props: undefined,
  };

  return component;
}

export function setupComponent(instance) {
  // initProps
  initProps(instance, instance.vnode.props);
  // TODO initSlots

  setupStatefulComponent(instance);
}

function setupStatefulComponent(instance: any) {
  const Component = instance.type;

  // 组件代理
  instance.proxy = new Proxy({ _: instance }, componentPublicHandler);

  const { setup } = Component;

  if (setup) {
    const setupResult = setup(shallowReadonly(instance.props));
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
