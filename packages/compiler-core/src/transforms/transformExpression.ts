import { NodeTypes } from "../ast";

/**
 * 处理插值类型 content 里面的内容
 *
 * @param node
 */
export function transformExpression(node) {
  if (node.type === NodeTypes.INTERPOLATION) {
    node.content = processExpression(node.content);
  }
}

function processExpression(node) {
  node.content = `_ctx.${node.content}`;
  return node;
}
