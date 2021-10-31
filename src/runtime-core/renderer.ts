import { isOn } from "../shared/index";
import { ShapeFlags } from "../shared/ShapeFlags";
import { createComponentInstance, setupComponent } from "./component";
import { Fragment,Text } from "./vnode";

export function render(vnode, container) {
  patch(vnode, container);
}

function patch(vnode: any, container: any) {
  const { type } = vnode;

  switch (type) {
    case Fragment:
      processFragment(vnode, container);
      break;

    case Text:
      processText(vnode, container);
      break;
      

    default:
      if (vnode.shapeFlags & ShapeFlags.ELEMENT) {
        processElement(vnode, container);
      } else if (vnode.shapeFlags & ShapeFlags.STATEFUL_COMPONENT) {
        processComponent(vnode, container);
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
function processText(vnode,container){
  const {children} = vnode
  const textNode = vnode.el = document.createTextNode(children)
  container.append(textNode)
}

/**
 * 处理fragment
 *
 * @param vnode
 * @param container
 */
function processFragment(vnode, container) {
  mountChildren(vnode, container);
}

/**
 * 处理element节点
 *
 * @param vnode
 * @param container
 */
function processElement(vnode: any, container: any) {
  mountElement(vnode, container);
}

function mountElement(vnode: any, container: any) {
  const el = (vnode.el = document.createElement(vnode.type));

  const { props, children, shapeFlags } = vnode;

  for (const key in props) {
    const val = props[key];
    if (isOn(key)) {
      const event = key.slice(2).toLowerCase();
      el.addEventListener(event, val);
    } else {
      el.setAttribute(key, val);
    }
  }

  // children
  if (shapeFlags & ShapeFlags.TEXT_CHILDREN) {
    el.textContent = children;
  } else if (shapeFlags & ShapeFlags.ARRAY_CHILDREN) {
    mountChildren(vnode, el);
  }
  container.append(el);
}

function mountChildren(vnodes, container) {
  vnodes.children.forEach((v) => {
    patch(v, container);
  });
}

/**
 * 处理component
 *
 * @param vnode
 * @param container
 */
function processComponent(vnode: any, container: any) {
  mountComponent(vnode, container);
}

function mountComponent(vnode: any, container: any) {
  const instance = createComponentInstance(vnode);

  setupComponent(instance);

  setupRenderEffect(instance, container);
}

function setupRenderEffect(instance: any, container: any) {
  const subTree = instance.render.call(instance.proxy);
  patch(subTree, container);
  instance.vnode.el = subTree.el;
}
