export * from "@mini-vue/runtime-dom"
import { registerRuntimeCompile } from "@mini-vue/runtime-dom"

import { baseCompile } from "@mini-vue/compiler-dom"
import * as runtimeDom from "@mini-vue/runtime-dom"

export function compileToFunction(template) {
  const { code } = baseCompile(template)
  // 这里记得要调用
  const render = new Function("Vue", code)(runtimeDom)

  return render
}

registerRuntimeCompile(compileToFunction)
