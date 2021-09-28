import { render } from "./renderer";
import { createVNode } from "./vnode";

export function createApp(rootComponent) {
  return {
    mound(rootContainer) {
      const vnode = createVNode(rootComponent);
      render(vnode, rootComponent);
    },
  };
}
