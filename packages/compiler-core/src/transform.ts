import { NodeTypes, RootNode } from "./ast"
import { TransformOptions } from "./options"
import { TO_DISPLAY_STRING } from "./runtimeHelpers"

export type NodeTransform = (
  node: any,
  context: TransformContext
) => void | (() => void) | (() => void)[]

export interface TransformContext extends Required<TransformOptions> {
  root: RootNode
  helpers: Map<symbol, number>
  helper<T extends symbol>(name: T): T
}

export function transform(root: any, options = {}) {
  const context = createTransformContext(root, options)

  traverseNode(root, context)

  createRootCodegen(root)

  root.helpers = [...context.helpers.keys()]
}

/**
 * 创建生成code的根节点
 *
 * @param root
 */
function createRootCodegen(root: any) {
  const child = root.children[0]
  if (child.type === NodeTypes.ELEMENT) {
    root.codegenNode = child.codegenNode
  } else {
    root.codegenNode = child
  }
}

/**
 * 便利节点
 *
 * @param node
 * @param context
 */
function traverseNode(node: any, context: TransformContext) {
  // 执行处理函数
  const exitFns: any = []
  const { nodeTransforms } = context
  for (let i = 0; i < nodeTransforms.length; i++) {
    const onExit = nodeTransforms[i](node, context)
    // 如果返回的是一个函数，代表后执行
    if (onExit) {
      exitFns.push(onExit)
    }
  }

  switch (node.type) {
    case NodeTypes.INTERPOLATION:
      context.helper(TO_DISPLAY_STRING)
      break

    case NodeTypes.ROOT:
    case NodeTypes.ELEMENT:
      // 遍历子节点
      traverseChildren(node, context)
      break

    default:
      break
  }

  // 后执行函数
  let i = exitFns.length
  while (i--) {
    exitFns[i]()
  }
}

/**
 * 便利子节点
 *
 * @param node
 * @param context
 */
function traverseChildren(node: any, context: any) {
  const children = node.children
  for (let i = 0; i < children.length; i++) {
    traverseNode(children[i], context)
  }
}

/**
 * 创建transform context
 *
 * @param root
 * @param options
 * @returns
 */
function createTransformContext(root, options) {
  const context: TransformContext = {
    root,
    nodeTransforms: options.nodeTransforms || [],
    helpers: new Map(),
    helper(name) {
      context.helpers.set(name, 1)
      return name
    },
  }

  return context
}
