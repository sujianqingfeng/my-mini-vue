import { isString } from "../../shared";
import { NodeTypes } from "./ast";
import {
  CREATE_ELEMENT_VNODE,
  helperMapName,
  TO_DISPLAY_STRING,
} from "./runtimeHelpers";

/**
 * 生成代码
 *
 * @param ast
 * @returns
 */
export function generate(ast) {
  const context = createCodegenContext(ast);
  const { push } = context;

  genFunctionPreamble(ast, context);

  const functionName = "render";
  const args = ["_ctx", "_cache"];
  const signature = args.join(",");

  push(`function ${functionName}(${signature}) {`);
  push("return ");

  genNode(ast.codegenNode, context);

  push("}");

  return {
    code: context.code,
  };
}

/**
 * 添加导入方法的代码
 *
 * @param ast
 * @param context
 */
function genFunctionPreamble(ast, context) {
  // 生成类似 const { toDisplayString: _toDisplayString } = Vue
  const { push } = context;
  const VueBinging = "Vue";
  const aliasHelper = (s) => `${helperMapName[s]}:_${helperMapName[s]}`;

  if (ast.helpers.length) {
    push(`const { ${ast.helpers.map(aliasHelper).join(",")} } = ${VueBinging}`);
  }

  push("\n");
  push("return ");
}

/**
 * 生成节点
 *
 * @param ast
 * @param context
 */
function genNode(node, context) {
  switch (node.type) {
    case NodeTypes.TEXT:
      genText(node, context);
      break;

    case NodeTypes.INTERPOLATION:
      genInterpolation(node, context);
      break;

    case NodeTypes.SIMPLE_EXPRESSION:
      genExpression(node, context);
      break;

    case NodeTypes.ELEMENT:
      genElement(node, context);
      break;

    case NodeTypes.COMPOUND_EXPRESSION:
      genCompoundExpression(node, context);
      break;

    default:
      break;
  }
}

/**
 * 生成复合类型的代码
 *
 *
 * @param node
 * @param context
 */
function genCompoundExpression(node, context) {
  const { children } = node;
  const { push } = context;

  for (let i = 0; i < children.length; i++) {
    const child = children[i];

    if (isString(child)) {
      push(child);
    } else {
      genNode(child, context);
    }
  }
}

function genElement(node, context) {
  const { push, helper } = context;
  const { tag, children, props } = node;
  push(`${helper(CREATE_ELEMENT_VNODE)}(`);

  const nullableNodes = genNullable([tag, props, children]);
  genNodeList(nullableNodes, context);

  push(")");
}

/**
 * 处理多个节点
 *
 * @param nodes
 * @param context
 */
function genNodeList(nodes, context) {
  const { push } = context;
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    if (isString(node)) {
      push(node);
    } else {
      genNode(node, context);
    }

    if (i < nodes.length - 1) {
      push(",");
    }
  }
}

/**
 * 处理虚值
 *
 * @param args
 * @returns
 */
function genNullable(args) {
  return args.map((arg) => arg || "null");
}

/**
 * 处理插值中表达式
 *
 * @param node
 * @param context
 */
function genExpression(node, context) {
  const { push } = context;
  push(node.content);
}

/**
 * 处理插值
 *
 * @param node
 * @param context
 */
function genInterpolation(node, context) {
  const { push, helper } = context;
  push(`${helper(TO_DISPLAY_STRING)}(`);
  genNode(node.content, context);
  push(")");
}

/**
 * 处理文本节点
 *
 * @param node
 * @param context
 */

function genText(node: any, context: any) {
  const { push } = context;
  push(`"${node.content}"`);
}

/**
 * 生成上下文 存储生成的代码已经工具函数
 *
 * @param ast
 * @returns
 */
function createCodegenContext(ast: any) {
  const context = {
    code: "",
    push: (source) => {
      context.code += source;
    },
    helper(key) {
      return `_${helperMapName[key]}`;
    },
  };

  return context;
}
