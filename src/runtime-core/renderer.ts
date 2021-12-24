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
    patch(null, vnode, container, null, null);
  }

  function patch(n1: any, n2: any, container: any, parentComponent, anchor) {
    const { type } = n2;

    switch (type) {
      case Fragment:
        processFragment(n1, n2, container, parentComponent, anchor);
        break;

      case Text:
        processText(n1, n2, container);
        break;

      default:
        if (n2.shapeFlags & ShapeFlags.ELEMENT) {
          processElement(n1, n2, container, parentComponent, anchor);
        } else if (n2.shapeFlags & ShapeFlags.STATEFUL_COMPONENT) {
          processComponent(n1, n2, container, parentComponent, anchor);
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
  function processFragment(n1, n2, container, parentComponent, anchor) {
    mountChildren(n2.children, container, parentComponent, anchor);
  }

  /**
   * 处理element节点
   *
   * @param n2
   * @param container
   */
  function processElement(
    n1,
    n2: any,
    container: any,
    parentComponent,
    anchor
  ) {
    if (!n1) {
      mountElement(n2, container, parentComponent, anchor);
    } else {
      patchElement(n1, n2, container, parentComponent, anchor);
    }
  }

  function patchElement(n1, n2, container, parentComponent, anchor) {
    // update
    console.log("patchElement");

    const prevProps = n1.props || {};
    const nextProps = n2.props || {};

    const el = (n2.el = n1.el);

    patchChildren(n1, n2, el, parentComponent, anchor);
    patchProps(el, prevProps, nextProps);
  }

  function patchChildren(n1, n2, container, parentComponent, anchor) {
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
        mountChildren(c2, container, parentComponent, anchor);
      } else {
        // array diff array
        patchKeyedChildren(c1, c2, container, parentComponent, anchor);
      }
    }
  }

  function patchKeyedChildren(
    c1,
    c2,
    container,
    parentComponent,
    parentAnchor
  ) {
    let i = 0;
    const l2 = c2.length;
    let e1 = c1.length - 1;
    let e2 = l2 - 1;

    const isSomeVNodeType = (n1, n2) => {
      return n1.type === n2.type && n1.key === n2.key;
    };

    // 左侧开始
    while (i <= e1 && i <= e2) {
      const n1 = c1[i];
      const n2 = c2[i];

      if (isSomeVNodeType(n1, n2)) {
        patch(n1, n2, container, parentComponent, parentAnchor);
      } else {
        break;
      }

      i++;
    }

    // 右侧开始
    while (i <= e1 && i <= e2) {
      const n1 = c1[e1];
      const n2 = c2[e2];

      if (isSomeVNodeType(n1, n2)) {
        patch(n1, n2, container, parentComponent, parentAnchor);
      } else {
        break;
      }

      e1--;
      e2--;
    }

    // 两端对比后
    if (i > e1) {
      if (i <= e2) {
        // add
        const nextPos = i + 1;
        // 锚点计算 如果是右侧多 则在新节点后面添加 null 如果左侧多 则在新节点最前面插入
        const anchor = nextPos < l2 ? c2[nextPos].el : null;

        while (i <= e2) {
          patch(null, c2[i], container, parentComponent, anchor);
          i++;
        }
      }
    } else if (i > e2) {
      // 新节点比老节点少，则删除老节点
      // delete
      while (i <= e1) {
        hostRemove(c1[i].el);
        i++;
      }
    } else {
      // 中间乱序的部分

      const s1 = i;
      const s2 = i;
      const toBePatched = e2 - s2 + 1;
      let patched = 0;

      const keyToNewIndexMap = new Map();

      for (let i = s2; i <= e2; i++) {
        const nextChild = c2[i];
        keyToNewIndexMap.set(nextChild.key, i);
      }

      for (let i = s1; i <= e1; i++) {
        const pervChild = c1[i];

        // 删除多余的旧节点
        if (patched >= toBePatched) {
          hostRemove(pervChild.el);
          continue;
        }

        let newIndex;
        // null undefined
        // 存在key
        if (pervChild.key !== null) {
          newIndex = keyToNewIndexMap.get(pervChild.key);
        } else {
          // 不存在就遍历
          for (let j = s2; j < e2; j++) {
            if (isSomeVNodeType(pervChild, c2[j])) {
              newIndex = j;
              break;
            }
          }
        }

        // 新节点里面找不到 就删除
        if (newIndex === undefined) {
          hostRemove(pervChild.el);
        } else {
          // 存在 就patch
          patch(pervChild, c2[newIndex], container, parentComponent, null);

          // 记录匹配数  用来删除多余的旧节点
          patched++;
        }
      }
    }
  }

  /**
   * 删除子节点
   * * @param children
   */
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

  function mountElement(vnode: any, container: any, parentComponent, anchor) {
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
      mountChildren(vnode.children, el, parentComponent, anchor);
    }
    hostInsert(el, container, anchor);
  }

  function mountChildren(children, container, parentComponent, anchor) {
    children.forEach((v) => {
      patch(null, v, container, parentComponent, anchor);
    });
  }

  /**
   * 处理component
   *
   * @param n2
   * @param container
   */
  function processComponent(
    n1,
    n2: any,
    container: any,
    parentComponent,
    anchor
  ) {
    mountComponent(n2, container, parentComponent, anchor);
  }

  function mountComponent(vnode: any, container: any, parentComponent, anchor) {
    const instance = createComponentInstance(vnode, parentComponent);

    setupComponent(instance);

    setupRenderEffect(instance, container, anchor);
  }

  function setupRenderEffect(instance: any, container: any, anchor) {
    effect(() => {
      if (!instance.isMounted) {
        const subTree = instance.render.call(instance.proxy);
        patch(null, subTree, container, instance, anchor);
        instance.vnode.el = subTree.el;
        instance.subTree = subTree;
        instance.isMounted = true;
      } else {
        console.log("update");

        const prevTree = instance.subTree;
        const nextTree = instance.render.call(instance.proxy);
        instance.subTree = nextTree;

        patch(prevTree, nextTree, container, instance, anchor);
      }
    });
  }

  return {
    createApp: createAppAPI(render),
  };
}
