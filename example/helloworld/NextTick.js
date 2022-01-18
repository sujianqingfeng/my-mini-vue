import { h, ref, nextTick } from "../../lib/mini-vue.esm.js";

export default {
  setup() {
    const count = ref(0);

    const onClick = () => {
      for (let index = 0; index < 100; index++) {
        count.value = index;
      }

      nextTick(() => {
        console.log("update 完成,nextTick 执行");
      });
    };

    return { count, onClick };
  },
  render() {
    return h("div", {}, [
      h("button", { onClick: this.onClick }, "count"),
      h("p", {}, "count:" + this.count),
    ]);
  },
};
