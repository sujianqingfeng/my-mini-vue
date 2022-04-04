import { NodeTypes } from "./ast";
import { helperMapName, TO_DISPLAY_STRING } from "./runtimeHelpers";

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

    default:
      break;
  }
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
