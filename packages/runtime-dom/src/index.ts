import { createRenderer } from "@mini-vue/runtime-core"
import { isOn } from "@mini-vue/shared"

/**
 * 创建节点
 *
 * @param type
 * @returns
 */
function createElement(type) {
  return document.createElement(type)
}

/**
 * 设置prop
 *
 * @param el
 * @param key
 * @param nextVal
 */
function patchProp(el, key, prevVal, nextVal) {
  if (isOn(key)) {
    const event = key.slice(2).toLowerCase()
    el.addEventListener(event, nextVal)
  } else {
    if (nextVal === undefined || nextVal === null) {
      el.removeAttribute(key)
    } else {
      el.setAttribute(key, nextVal)
    }
  }
}

/**
 * 添加节点
 *
 * @param el
 * @param parent
 */
function insert(child, parent, anchor) {
  // parent.append(el);
  parent.insertBefore(child, anchor || null)
}

/**
 * 删除元素
 *
 * @param el
 */
function remove(el) {
  const parent = el.parentNode
  if (parent) {
    parent.removeChild(el)
  }
}

/**
 * 修改节点为文本
 *
 * @param el
 * @param text
 */
function setElementText(el, text) {
  el.textContent = text
}

// TODO 更多的dom操作方法

const renderer: any = createRenderer({
  createElement,
  patchProp,
  insert,
  remove,
  setElementText,
})

export function createApp(...args) {
  // 这里有点绕  这里调用的实际是crateApp.ts中createAppAPI中的createApp
  // renderer = { createApp: createAppAPI = { createApp }  }
  return renderer.createApp(...args)
}

export * from "@mini-vue/runtime-core"
