import { h, getCurrentInstance, provide, ref } from "../../lib/mini-vue.esm.js";

export default {
  setup() {
    return {};
  },
  render() {
    return h("p", {}, "父组件：count:" + this.$props.count);
  },
};
