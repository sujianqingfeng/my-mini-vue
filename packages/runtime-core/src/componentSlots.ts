import { ShapeFlags } from "@mini-vue/shared"

export function initSlots(instance, children) {
  const { vnode } = instance

  if (vnode.shapeFlags & ShapeFlags.SLOT_CHILDREN) {
    normalizeObjectSlots(children, instance.slots)
  }
}

function normalizeObjectSlots(children: any, slots: any) {
  for (const key in children) {
    // 取出fun
    const value = children[key]
    // 重新构建一个函数，用来传递参数
    slots[key] = (props) => normalizeSlotValue(value(props))
  }
}

function normalizeSlotValue(value: any) {
  return Array.isArray(value) ? value : [value]
}
