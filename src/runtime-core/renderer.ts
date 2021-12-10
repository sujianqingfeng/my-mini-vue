import { effect } from "../reactivity/effect";
import { ShapeFlags } from "../shared/ShapeFlags";
import { createComponentInstance, setupComponent } from "./component";
import { createAppAPI } from "./createApp";
import { Fragment, Text } from "./vnode";

export function createRenderer(options) {
  const {
    createElement: hostCreateElement,
    patchProp: hostPatchProp,
    insert: hostInsert,
    remove: hostRemove,
    setElementText: hostSetElementText,
  } = options;

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
    mountChildren(n2.children, container, parentComponent);
  }

  /**
   * 处理element节点
   *
   * @param n2
   * @param container
   */
  function processElement(n1, n2: any, container: any, parentComponent) {
    if (!n1) {
      mountElement(n2, container, parentComponent);
    } else {
      patchElement(n1, n2, container, parentComponent);
    }
  }

  function patchElement(n1, n2, container, parentComponent) {
    // update
    console.log("patchElement");

    const prevProps = n1.props || {};
    const nextProps = n2.props || {};

    const el = (n2.el = n1.el);

    patchChildren(n1, n2, el, parentComponent);
    patchProps(el, prevProps, nextProps);
  }

  function patchChildren(n1, n2, container, parentComponent) {
    console.log("patchChildren");
    const prevShapeFlags = n1.shapeFlags;
    const c1 = n1.children;
    const { shapeFlags } = n2;
    const c2 = n2.children;

    // 新的子节点是text
    if (shapeFlags & ShapeFlags.TEXT_CHILDREN) {
      // 老的子字节的是array
      if (prevShapeFlags & ShapeFlags.ARRAY_CHILDREN) {
        // 1. 删除老的子节点
        unmountChildren(n1.children);
      }

      // 设置节点为text
      if (c1 !== c2) {
        hostSetElementText(container, c2);
      }
    } else {
      // 新的子节点必定是array

      // 老的子节点是text
      if (prevShapeFlags & ShapeFlags.TEXT_CHILDREN) {
        hostSetElementText(container, "");
        mountChildren(c2, container, parentComponent);
      }
    }
  }

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

  function mountElement(vnode: any, container: any, parentComponent) {
    const el = (vnode.el = hostCreateElement(vnode.type));

    const { props, children, shapeFlags } = vnode;

    for (const key in props) {
      const val = props[key];
      hostPatchProp(el, key, null, val);
    }

    // children
    if (shapeFlags & ShapeFlags.TEXT_CHILDREN) {
      el.textContent = children;
    } else if (shapeFlags & ShapeFlags.ARRAY_CHILDREN) {
      mountChildren(vnode.children, el, parentComponent);
    }
    hostInsert(el, container);
  }

  function mountChildren(children, container, parentComponent) {
    children.forEach((v) => {
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
