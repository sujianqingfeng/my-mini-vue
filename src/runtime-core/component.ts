export function createComponentInstance(vnode, container) {
  const component = {
    vnode,
    type: vnode.type,
  };

  return component;
}

export function setupComponent(instance) {
  // TODO
  // initProps
  // initSlots

  setupStatefulComponent(instance);
}

function setupStatefulComponent(instance: any) {
  const component = instance.type;

  const { setup } = component;

  if (setup) {
    const setupResult = setup();
    handleSetupResult(instance, setupResult);
  }
}
function handleSetupResult(instance, setupResult: any) {
  // 返回对象
  if (typeof setupResult === "object") {
    instance.setupResult = setupResult;
  }

  // TODO function

  finishComponentSetup(instance);
}
function finishComponentSetup(instance: any) {
  const component = instance.type;

  if (!component.render) {
    instance.render = component.render;
  }
}
