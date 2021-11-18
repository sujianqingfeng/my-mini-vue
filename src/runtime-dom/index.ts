import { createRenderer } from "../runtime-core";
import { isOn } from "./../shared/index";

/**
 * 创建节点
 *
 * @param type
 * @returns
 */
function createElement(type) {
  return document.createElement(type);
}

/**
 * 设置prop
 *
 * @param el
 * @param key
 * @param val
 */
function patchProp(el, key, val) {
  if (isOn(key)) {
    const event = key.slice(2).toLowerCase();
    el.addEventListener(event, val);
  } else {
    el.setAttribute(key, val);
  }
}

/**
 * 添加节点
 *
 * @param el
 * @param parent
 */
function insert(el, parent) {
  parent.append(el);
}

// TODO 更多的dom操作方法

const renderer: any = createRenderer({ createElement, patchProp, insert });

export function createApp(...args) {
  // 这里有点绕  这里调用的实际是crateApp.ts中createAppAPI中的createApp
  // renderer = { createApp: createAppAPI = { createApp }  }
  return renderer.createApp(...args);
}

export * from "../runtime-core";
