import { h, renderSlots, createTextVNode } from "../../lib/mini-vue.esm.js";

export const Foo = {
  setup(props, { emit }) {
    // 这里会有警告
    props.count++;

    const handleFooClick = () => {
      emit("foo-foo", "i am params");
    };

    return { handleFooClick };
  },

  render() {
    return h(
      "div",
      {
        onClick: () => {
          this.handleFooClick();
        },
      },
      [
        renderSlots(this.$slots, "header", { age: 1 }),
        `Foo:${this.count}`,
        renderSlots(this.$slots, "footer"),
        createTextVNode("i am text node"),
      ]
    );
  },
};
