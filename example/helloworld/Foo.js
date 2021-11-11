import {
  h,
  renderSlots,
  createTextVNode,
  getCurrentInstance,
  inject,
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

    const testInjectFoo = inject("test-inject");
    const testInjectBar = inject("bar", "defaultBar");

    return { handleFooClick, testInjectFoo, testInjectBar };
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
        h("p", {}, this.testInjectFoo),
        h("p", {}, this.testInjectBar),
      ]
    );
  },
};
