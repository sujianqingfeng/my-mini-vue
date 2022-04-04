import { baseParse } from "../src/parse";
import { transform } from "../src/transform";
import { generate } from "../src/codegen";

describe("codegen", () => {
  it("string", () => {
    const ast = baseParse("hi");

    transform(ast);
    const { code } = generate(ast);

    expect(code).toMatchSnapshot();
  });
});
