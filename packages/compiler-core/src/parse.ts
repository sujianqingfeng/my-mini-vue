import { NodeTypes } from "./ast";

const enum TagType {
  Start,
  End,
}

export function baseParse(content: string) {
  const context = createParseContext(content);
  return createRoot(parseChildren(context, []));
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
function parseChildren(context, ancestors) {
  const nodes: any = [];

  while (!isEnd(context, ancestors)) {
    let node;
    const s = context.source;
    if (s.startsWith("{{")) {
      node = parseInterpolation(context);
    } else if (s[0] === "<") {
      if (/[a-z]/i.test(s[1])) {
        node = parseElement(context, ancestors);
      }
    }

    if (!node) {
      node = parseText(context);
    }

    nodes.push(node);
  }
  return nodes;
}

/**
 * children 解析完成标志
 *
 * @param context
 * @returns
 */
function isEnd(context, ancestors) {
  const s = context.source;

  if (s.startsWith("</")) {
    for (let i = 0; i < ancestors.length; i++) {
      const tag = ancestors[i].tag;
      if (startsWithEndTagOpen(s, tag)) {
        return true;
      }
    }
  }

  return !s;
}

/**
 * 解析text节点
 * * @param context
 * @returns
 */
function parseText(context: any) {
  let endIndex = context.source.length;
  const endTokens = ["{{", "<"];

  for (let i = 0; i < endTokens.length; i++) {
    const index = context.source.indexOf(endTokens[i]);

    if (index != -1 && index < endIndex) {
      endIndex = index;
    }
  }

  const content = parseTextData(context, endIndex);

  return {
    type: NodeTypes.TEXT,
    content,
  };
}

/**
 * 解析text数据
 *
 * @param context
 * @param length
 * @returns
 */
function parseTextData(context: any, length) {
  const content = context.source.slice(0, length);
  advanceBy(context, length);
  return content;
}

/**
 * 解析element
 *
 * @param context
 * @returns
 */
function parseElement(context: any, ancestors) {
  const element: any = parseTag(context, TagType.Start);
  ancestors.push(element);
  // 注意顺序是在endTag之前
  element.children = parseChildren(context, ancestors);
  ancestors.pop();

  if (startsWithEndTagOpen(context.source, element.tag)) {
    parseTag(context, TagType.End);
  } else {
    throw new Error(`unclosed tag ${element.tag}`);
  }

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

  const rowContent = parseTextData(context, rowContentLength);

  const content = rowContent.trim();

  advanceBy(context, closeDelimiter.length);

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
  return { children, type: NodeTypes.ROOT };
}

/**
 * 判断文本开头是否是传入的tag
 *
 * @param source
 * @param tag
 */
function startsWithEndTagOpen(source, tag) {
  return (
    source.startsWith("</") &&
    source.slice(2, 2 + tag.length).toLowerCase() === tag.toLowerCase()
  );
}
