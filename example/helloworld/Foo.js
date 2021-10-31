import {
  h,
  renderSlots,
  createTextVNode,
  getCurrentInstance,
} from "../../lib/mini-vue.esm.js";

export const Foo = {
  name: "foo",
  setup(props, { emit }) {
    console.log("foo instance", getCurrentInstance());

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
