import { h } from "../../lib/mini-vue.esm.js";
import { Foo } from "./Foo.js";
export default {
  render() {
    return h(
      "div",
      {
        id: "div",
        onClick: () => {
          console.log("click");
        },
      },
      [
        h("p", {}, this.msg),
        h("p", {}, "mini-vue"),
        h(Foo, {
          count: 1,
          onFooFoo: (params) => {
            console.log("foo", params);
          },
        }),
      ]
    );
  },

  setup() {
    return {
      msg: "hello",
    };
  },
};
