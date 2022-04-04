export * from "./runtime-dom";
import { registerRuntimeCompile } from "./runtime-dom";

import { baseCompile } from "./compiler-core/src";
import * as runtimeDom from "./runtime-dom";

export function compileToFunction(template) {
  const { code } = baseCompile(template);
  // 这里记得要调用
  const render = new Function("Vue", code)(runtimeDom);

  return render;
}

registerRuntimeCompile(compileToFunction);
