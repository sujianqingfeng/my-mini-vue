import { NodeTypes } from "./ast";

const enum TagType {
  Start,
  End,
}

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

  let node;
  const s = context.source;
  if (s.startsWith("{{")) {
    node = parseInterpolation(context);
  } else if (s[0] === "<") {
    if (/[a-z]/i.test(s[1])) {
      node = parseElement(context);
    }
  }
  nodes.push(node);

  return nodes;
}

/**
 * 解析element
 *
 * @param context
 * @returns
 */
function parseElement(context: any) {
  const element = parseTag(context, TagType.Start);
  parseTag(context, TagType.End);
  return element;
}

/**
 * 解析tag
 *
 * @param context
 * @param type
 * @returns
 */
function parseTag(context: any, type: TagType) {
  const match: any = /^<\/?([a-z]*)/i.exec(context.source);
  let tag = "";
  tag = match[1];
  advanceBy(context, match[0].length);
  advanceBy(context, 1);

  if (type === TagType.End) {
    return;
  }

  return {
    type: NodeTypes.ELEMENT,
    tag,
  };
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
