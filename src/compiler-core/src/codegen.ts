/**
 * 生成代码
 *
 * @param ast
 * @returns
 */
export function generate(ast) {
  const context = createCodegenContext(ast);
  const { push } = context;

  push("return ");

  const functionName = "render";
  const args = ["_ctx", "_cache"];
  const signature = args.join(",");

  push(`function ${functionName}(${signature}) {`);
  push("return ");

  genNode(ast, context);

  push("}");

  return {
    code: context.code,
  };
}

/**
 * 生成节点
 *
 * @param ast
 * @param context
 */
function genNode(ast, context) {
  const { push } = context;
  const node = ast.codegenNode;
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
  };

  return context;
}
