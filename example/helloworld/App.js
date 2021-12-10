import { h, getCurrentInstance, provide, ref } from "../../lib/mini-vue.esm.js";
import { Foo } from "./Foo.js";
import UpdateProps from "./UpdateProps.js";

import UpdateArrayToText from "./UpdateArrayToText.js";
import UpdateTextToArray from "./UpdateTextToArray.js";

export default {
  name: "app",
  render() {
    return h(
      "div",
      {
        id: "div",
        onClick: () => {
          console.log("click");
          this.increment();
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
        h("p", {}, "点击我，count:", this.count),
        h("p", {}, "下面是更新props"),
        h(UpdateProps),
        // h(UpdateArrayToText),
        h(UpdateTextToArray),
      ]
    );
  },

  setup() {
    provide("test-inject", "foo");
    provide("bar");

    console.log("app instance", getCurrentInstance());

    const count = ref(0);

    const increment = () => {
      count.value++;
    };
    return {
      msg: "hello",
      increment,
      count,
    };
  },
};
