import { NodeTypes } from "../src/ast";
import { baseParse } from "../src/parse";
import { transform } from "../src/transform";

describe("transform", () => {
  it("happy path", () => {
    const ast = baseParse("<div>hi,{{message}}</div>");

    transform(ast, {
      nodeTransforms: [
        (node) => {
          if (node.type === NodeTypes.TEXT) {
            node.content += " mini-vue";
          }
        },
      ],
    });

    expect(ast.children[0].children[0].content).toBe("hi, mini-vue");
  });
});
