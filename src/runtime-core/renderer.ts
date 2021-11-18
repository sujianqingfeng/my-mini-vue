import { isOn } from "../shared/index";
import { ShapeFlags } from "../shared/ShapeFlags";
import { createComponentInstance, setupComponent } from "./component";
import { createAppAPI } from "./createApp";
import { Fragment, Text } from "./vnode";

export function createRenderer(options) {
  const { createElement, patchProp, insert } = options;

  function render(vnode, container) {
    patch(vnode, container, null);
  }

  function patch(vnode: any, container: any, parentComponent) {
    const { type } = vnode;

    switch (type) {
      case Fragment:
        processFragment(vnode, container, parentComponent);
        break;

      case Text:
        processText(vnode, container);
        break;

      default:
        if (vnode.shapeFlags & ShapeFlags.ELEMENT) {
          processElement(vnode, container, parentComponent);
        } else if (vnode.shapeFlags & ShapeFlags.STATEFUL_COMPONENT) {
          processComponent(vnode, container, parentComponent);
        }
        break;
    }
  }

  /**
   *
   * 处理text节点
   * @param vnode
   * @param container
   */
  function processText(vnode, container) {
    const { children } = vnode;
    const textNode = (vnode.el = document.createTextNode(children));
    container.append(textNode);
  }

  /**
   * 处理fragment
   *
   * @param vnode
   * @param container
   */
  function processFragment(vnode, container, parentComponent) {
    mountChildren(vnode, container, parentComponent);
  }

  /**
   * 处理element节点
   *
   * @param vnode
   * @param container
   */
  function processElement(vnode: any, container: any, parent) {
    mountElement(vnode, container, parent);
  }

  function mountElement(vnode: any, container: any, parentComponent) {
    const el = (vnode.el = createElement(vnode.type));

    const { props, children, shapeFlags } = vnode;

    for (const key in props) {
      const val = props[key];
      patchProp(el,key,val)
    }

    // children
    if (shapeFlags & ShapeFlags.TEXT_CHILDREN) {
      el.textContent = children;
    } else if (shapeFlags & ShapeFlags.ARRAY_CHILDREN) {
      mountChildren(vnode, el, parentComponent);
    }
    insert(el, container);
  }

  function mountChildren(vnodes, container, parentComponent) {
    vnodes.children.forEach((v) => {
      patch(v, container, parentComponent);
    });
  }

  /**
   * 处理component
   *
   * @param vnode
   * @param container
   */
  function processComponent(vnode: any, container: any, parentComponent) {
    mountComponent(vnode, container, parentComponent);
  }

  function mountComponent(vnode: any, container: any, parentComponent) {
    const instance = createComponentInstance(vnode, parentComponent);

    setupComponent(instance);

    setupRenderEffect(instance, container);
  }

  function setupRenderEffect(instance: any, container: any) {
    const subTree = instance.render.call(instance.proxy);
    patch(subTree, container, instance);
    instance.vnode.el = subTree.el;
  }

  return {
    createApp:createAppAPI(render)
  };
}
