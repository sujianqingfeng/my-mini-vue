import { h } from "../../lib/mini-vue.esm.js";

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
      `Foo:${this.count}`
    );
  },
};
