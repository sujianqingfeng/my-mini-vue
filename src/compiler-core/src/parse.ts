import { NodeTypes } from "./ast";

export function baseParse(content: string) {
  const context = createParseContext(content);
  return createRoot(parseChildren(context));
}

/**
 * 创建解析的上下文 按照一定格式存储数据
 *
 * @param content
 * @returns
 */
function createParseContext(content) {
  return {
    source: content,
  };
}

/**
 * 解析内容为子节点
 *
 * @param context
 * @returns
 */
function parseChildren(context) {
  const nodes: any = [];

  if (context.source.startsWith("{{")) {
    const node = parseInterpolation(context);
    nodes.push(node);
  }

  return nodes;
}

/**
 * 解析插值
 *
 * @param context
 * @returns
 */
function parseInterpolation(context) {
  const openDelimiter = "{{";
  const closeDelimiter = "}}";

  const closeIndex = context.source.indexOf(
    closeDelimiter,
    openDelimiter.length
  );

  advanceBy(context, openDelimiter.length);
  const rowContentLength = closeIndex - openDelimiter.length;

  const rowContent = context.source.slice(0, rowContentLength);
  const content = rowContent.trim();

  advanceBy(context, rowContentLength + closeDelimiter.length);

  return {
    type: NodeTypes.INTERPOLATION,
    content: {
      type: NodeTypes.SIMPLE_EXPRESSION,
      content,
    },
  };
}

/**
 * 截取内容
 *
 * @param context
 * @param length
 */
function advanceBy(context, length) {
  context.source = context.source.slice(length);
}

/**
 * 创建根节点
 *
 * @param children
 * @returns
 */
function createRoot(children) {
  return { children };
}
