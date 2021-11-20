import { effect } from "../reactivity/effect";
import { ShapeFlags } from "../shared/ShapeFlags";
import { createComponentInstance, setupComponent } from "./component";
import { createAppAPI } from "./createApp";
import { Fragment, Text } from "./vnode";

export function createRenderer(options) {
  const { createElement, patchProp, insert } = options;

  function render(vnode, container) {
    patch(null, vnode, container, null);
  }

  function patch(n1: any, n2: any, container: any, parentComponent) {
    const { type } = n2;

    switch (type) {
      case Fragment:
        processFragment(n1, n2, container, parentComponent);
        break;

      case Text:
        processText(n1, n2, container);
        break;

      default:
        if (n2.shapeFlags & ShapeFlags.ELEMENT) {
          processElement(n1, n2, container, parentComponent);
        } else if (n2.shapeFlags & ShapeFlags.STATEFUL_COMPONENT) {
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
  function processFragment(n1, n2, container, parentComponent) {
    mountChildren(n2, container, parentComponent);
  }

  /**
   * 处理element节点
   *
   * @param n2
   * @param container
   */
  function processElement(n1, n2: any, container: any, parent) {
    if (!n1) {
      mountElement(n2, container, parent);
    } else {
      patchElement(n1, n2, container);
    }
  }

  function patchElement(n1, n2, container) {
    // update
    console.log("patchElement");
  }

  function mountElement(vnode: any, container: any, parentComponent) {
    const el = (vnode.el = createElement(vnode.type));

    const { props, children, shapeFlags } = vnode;

    for (const key in props) {
      const val = props[key];
      patchProp(el, key, val);
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
      patch(null, v, container, parentComponent);
    });
  }

  /**
   * 处理component
   *
   * @param n2
   * @param container
   */
  function processComponent(n1, n2: any, container: any, parentComponent) {
    mountComponent(n2, container, parentComponent);
  }

  function mountComponent(vnode: any, container: any, parentComponent) {
    const instance = createComponentInstance(vnode, parentComponent);

    setupComponent(instance);

    setupRenderEffect(instance, container);
  }

  function setupRenderEffect(instance: any, container: any) {
    effect(() => {
      if (!instance.isMounted) {
        const subTree = instance.render.call(instance.proxy);
        patch(null, subTree, container, instance);
        instance.vnode.el = subTree.el;
        instance.subTree = subTree;
        instance.isMounted = true;
      } else {
        console.log("update");

        const prevTree = instance.subTree;
        const nextTree = instance.render.call(instance.proxy);
        instance.subTree = nextTree;

        patch(prevTree, nextTree, container, instance);
      }
    });
  }

  return {
    createApp: createAppAPI(render),
  };
}
