import { h, ref } from "../../lib/mini-vue.esm.js";

export default {
  setup(props) {
    const isChange = ref(false);

    window.isChange = isChange;

    return { isChange };
  },

  render() {
    //左侧开始
    // A B
    // A B C
    // i = 2 e1 = 1 e2 = 2
    // 新节点比老节点多 则创建
    // const prevChild = [h("p", { key: "A" }, "A"), h("p", { key: "B" }, "B")];
    // const nextChild = [
    //   h("p", { key: "A" }, "A"),
    //   h("p", { key: "B" }, "B"),
    //   h("p", { key: "C" }, "C"),
    // ];

    // 右侧开始
    // B A
    // C B A
    // i = 0 e1 = -1 e2 = 0
    // 新节点比老节点多 则创建
    // const prevChild = [h("p", { key: "B" }, "B"), h("p", { key: "A" }, "A")];
    // const nextChild = [
    //   h("p", { key: "C" }, "C"),
    //   h("p", { key: "B" }, "B"),
    //   h("p", { key: "A" }, "A"),
    // ];

    // A B C
    // A B
    // i = 2 e1 = 2 e2 = 1
    // 新节点比老节点少 则删除
    // const prevChild = [
    //   h("p", { key: "A" }, "A"),
    //   h("p", { key: "B" }, "B"),
    //   h("p", { key: "C" }, "C"),
    // ];
    // const nextChild = [h("p", { key: "A" }, "A"), h("p", { key: "B" }, "B")];

    // C B A
    // B A
    // i = 0 e1 = 1 e2 = -1
    // 新节点比老节点少 则删除
    // const prevChild = [
    //   h("p", { key: "C" }, "C"),
    //   h("p", { key: "B" }, "B"),
    //   h("p", { key: "A" }, "A"),
    // ];
    // const nextChild = [h("p", { key: "B" }, "B"), h("p", { key: "A" }, "A")];

    // 乱序部分

    // A B F C D   |  A B C F D
    // A C B D

    const prevChild = [
      h("p", { key: "A" }, "A"),
      h("p", { key: "B" }, "B"),
      h("p", { key: "F" }, "F"),
      h("p", { key: "C" }, "C"),
      h("p", { key: "D" }, "D"),
    ];

    const nextChild = [
      h("p", { key: "A" }, "A"),
      h("p", { key: "C" }, "C"),
      h("p", { key: "B" }, "B"),
      h("p", { key: "D" }, "D"),
    ];

    const prev = h("div", {}, prevChild);
    const next = h("div", {}, nextChild);

    return this.isChange ? next : prev;
  },
};
