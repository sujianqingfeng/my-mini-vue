import { h, ref } from "../../lib/mini-vue.esm.js";

export default {
  setup(props) {
    const isChange = ref(false);

    window.isChange = isChange;

    function handleChange(e) {
      console.log("handleChange 111", e);
      isChange.value = true;
      e.stopPropagation();
    }

    return { isChange, handleChange };
  },

  render() {
    const array = h("div", {}, [h("p", {}, "array 1"), h("p", {}, "array 2")]);
    const text = h("div", {}, "i am text");

    return this.isChange === true ? text : array;
    // h("div", {}, [
    //   h("button", { onClick: this.handleChange }, "update:array to text"),
    //   child,
    // ]);
  },
};
