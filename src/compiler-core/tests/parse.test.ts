import { NodeTypes } from "../src/ast";
import { baseParse } from "../src/parse";

describe("Parse", () => {
  describe("interpolation", () => {
    it("simple interpolation", () => {
      const ast = baseParse("{{ message }}");

      expect(ast.children[0]).toStrictEqual({
        type: NodeTypes.INTERPOLATION,
        content: {
          type: NodeTypes.SIMPLE_EXPRESSION,
          content: "message",
        },
      });
    });
  });

  describe("element", () => {
    it("simple element", () => {
      const ast = baseParse("<div></div>");

      expect(ast.children[0]).toStrictEqual({
        type: NodeTypes.ELEMENT,
        tag: "div",
      });
    });
  });

  describe("text", () => {
    it("some text", () => {
      const ast = baseParse("some text");

      expect(ast.children[0]).toStrictEqual({
        type: NodeTypes.TEXT,
        content: "some text",
      });
    });
  });
});
