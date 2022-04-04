import { effect } from "../reactivity/effect";
import { ShapeFlags } from "../shared/ShapeFlags";
import { createComponentInstance, setupComponent } from "./component";
import { createAppAPI } from "./createApp";
import { shouldUpdateComponent } from "./componentUpdateUtils";
import { Fragment, Text } from "./vnode";
import { queueJobs } from "./scheduler";

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

      // 新节点key对应在新节点中的索引位置
      const keyToNewIndexMap = new Map();

      for (let i = s2; i <= e2; i++) {
        const nextChild = c2[i];
        keyToNewIndexMap.set(nextChild.key, i);
      }

      // 新节点索引 对应 老节点中的索引位置  从中间乱序开始 所以长度为toBePatched
      const newIndexToOldIndexMap = new Array(toBePatched);
      for (let i = 0; i < toBePatched; i++) newIndexToOldIndexMap[i] = 0;

      let moved = false;
      // 用来存储上一个新节点的位置
      let maxNewIndexSoFar = 0;

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
          for (let j = s2; j <= e2; j++) {
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
          //  只要判定 在新节点中不连续 就需要移动

          if (maxNewIndexSoFar <= newIndex) {
            maxNewIndexSoFar = newIndex;
          } else {
            moved = true;
          }

          // 存储 新节点在老节点中的位置
          // 之所以要加1 是因为后续能够判断新增节点  虽然加了1 但是最长子序列的计算结果不会发生变化 因为计算的是位置
          newIndexToOldIndexMap[newIndex - s2] = i + 1;

          // 存在 就patch
          patch(pervChild, c2[newIndex], container, parentComponent, null);

          // 记录匹配数  用来删除多余的旧节点
          patched++;
        }
      }

      // 在patch之后，还存在位置不一致 或者 多节点的情况
      // 所以需要移动 和新增

      // 求出最长递增子序列
      const increasingNewIndexSequence = moved
        ? getSequence(newIndexToOldIndexMap)
        : [];
      let j = increasingNewIndexSequence.length - 1;

      // 之所以倒叙 因为插入的时候确定锚点的时候  后面的锚点是确定不会在变化的
      for (let i = toBePatched - 1; i >= 0; i--) {
        const newIndex = s2 + i;
        const nextChild = c2[newIndex];
        const anchor = newIndex + 1 < l2 ? c2[newIndex + 1].el : null;

        // 在老节点当中不存在 就需要新增 所以我们直接判断初始化数据是否为0即可
        if (newIndexToOldIndexMap[i] === 0) {
          patch(null, nextChild, container, parentComponent, anchor);
        } else if (moved) {
          if (j < 0 || j !== increasingNewIndexSequence[i]) {
            // 需要移动
            hostInsert(nextChild.el, container, anchor);
          } else {
            // 不需要移动则进行下一个对比
            j--;
          }
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
    if (!n1) {
      mountComponent(n2, container, parentComponent, anchor);
    } else {
      updateComponent(n1, n2);
    }
  }

  function updateComponent(n1, n2) {
    const instance = (n2.component = n1.component);
    if (shouldUpdateComponent(n1, n2)) {
      // next 存储新的vnode
      instance.next = n2;
      instance.update();
    } else {
      n2.el = n1.el;
      instance.vnode = n2;
    }
  }

  function mountComponent(vnode: any, container: any, parentComponent, anchor) {
    const instance = (vnode.component = createComponentInstance(
      vnode,
      parentComponent
    ));

    setupComponent(instance);

    setupRenderEffect(instance, container, anchor);
  }

  function setupRenderEffect(instance: any, container: any, anchor) {
    instance.update = effect(
      () => {
        if (!instance.isMounted) {
          const { proxy } = instance;
          const subTree = instance.render.call(proxy, proxy);
          patch(null, subTree, container, instance, anchor);
          instance.vnode.el = subTree.el;
          instance.subTree = subTree;
          instance.isMounted = true;
        } else {
          console.log("update");

          const { next, vnode, proxy } = instance;

          if (next) {
            next.el = vnode.el;
            updateComponentPreRender(instance, next);
          }

          const prevTree = instance.subTree;
          const nextTree = instance.render.call(proxy, proxy);
          instance.subTree = nextTree;

          patch(prevTree, nextTree, container, instance, anchor);
        }
      },
      {
        scheduler() {
          queueJobs(instance.update);
        },
      }
    );
  }

  // 组件更新主要就是更新数据 -> props
  function updateComponentPreRender(instance, next) {
    instance.vnode = next;
    instance.next = null;
    instance.props = next.props;
  }

  return {
    createApp: createAppAPI(render),
  };
}

// TODO 后续自己来写一些 这个是从网上找的

function getSequence(nums) {
  let n = nums.length;
  if (n <= 1) {
    return n;
  }
  let tail = [nums[0]]; //存放最长上升子序列数组
  for (let i = 0; i < n; i++) {
    if (nums[i] > tail[tail.length - 1]) {
      //当nums中的元素比tail中的最后一个大时 可以放心push进tail
      tail.push(nums[i]);
    } else {
      //否则进行二分查找
      let left = 0;
      let right = tail.length - 1;
      while (left < right) {
        let mid = (left + right) >> 1;
        if (tail[mid] < nums[i]) {
          left = mid + 1;
        } else {
          right = mid;
        }
      }
      tail[left] = nums[i]; //将nums[i]放置到合适的位置，此时前面的元素都比nums[i]小
    }
  }
  return tail;
}
