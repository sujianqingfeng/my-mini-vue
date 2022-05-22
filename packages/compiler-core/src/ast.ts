import { CREATE_ELEMENT_VNODE } from "./runtimeHelpers"

export interface RootNode {
  codegenNode?: any
}

export const enum NodeTypes {
  INTERPOLATION,
  SIMPLE_EXPRESSION,
  ELEMENT,
  TEXT,
  ROOT,
  COMPOUND_EXPRESSION,
}

/**
 * 创建Element辅助方法
 *
 * @param context
 * @param tag
 * @param props
 * @param children
 * @returns
 */
export function createVNodeCall(context, tag, props, children) {
  context.helper(CREATE_ELEMENT_VNODE)
  return {
    type: NodeTypes.ELEMENT,
    tag,
    props,
    children,
  }
}
