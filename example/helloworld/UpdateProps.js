import { h, ref } from "../../lib/mini-vue.esm.js";

export default {
  setup() {
    const props = ref({
      bar: "bar",
      foo: "foo",
    });

    function changeBar() {
      // props.value.bar = "new bar";
      props.value.bar = undefined 
    }

    return { props, changeBar };
  },
  render() {
    return h("div", { ...this.props }, [
      h("div", {}, [h("button", { onClick: this.changeBar }, "bar change")]),
    ]);
  },
};
