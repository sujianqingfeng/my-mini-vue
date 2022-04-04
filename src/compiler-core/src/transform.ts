export function transform(root, options = {}) {
  const context = createTransformContext(root, options);

  traverseNode(root, context);

  createRootCodegen(root);
}

/**
 * 创建生成code的根节点
 *
 * @param root
 */
function createRootCodegen(root: any) {
  root.codegenNode = root.children[0];
}

/**
 * 便利节点
 *
 * @param node
 * @param context
 */
function traverseNode(node: any, context) {
  // 执行处理函数
  const { nodeTransforms } = context;
  for (let i = 0; i < nodeTransforms.length; i++) {
    const transform = nodeTransforms[i];
    transform(node);
  }

  // 遍历子节点
  traverseChildren(node, context);
}

/**
 * 便利子节点
 *
 * @param node
 * @param context
 */
function traverseChildren(node: any, context: any) {
  const children = node.children;
  if (children) {
    for (let i = 0; i < children.length; i++) {
      traverseNode(children[i], context);
    }
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
  const context = {
    root,
    nodeTransforms: options.nodeTransforms || [],
  };

  return context;
}
