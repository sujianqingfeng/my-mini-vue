import { h, getCurrentInstance, provide } from "../../lib/mini-vue.esm.js";
import { Foo } from "./Foo.js";
export default {
  name: "app",
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
        h(
          Foo,
          {
            count: 1,
            onFooFoo: (params) => {
              console.log("foo", params);
            },
          },
          {
            header: ({ age }) => h("p", {}, "header" + age),
            footer: () => h("p", {}, "footer"),
          }
        ),
      ]
    );
  },

  setup() {
    provide("test-inject", "foo");
    provide("bar");

    console.log("app instance", getCurrentInstance());
    return {
      msg: "hello",
    };
  },
};
