import { ref } from "../../lib/mini-vue.esm.js";

export default {
  name:'App',
  template:`<div>hi,{{message}},count:{{count}}</div>`,
  setup(){
    const count = ref(0)

    setInterval(() => {
      count.value += 1
    }, 1000);

    return {
      message:'mini-vue',
      count
    }
  }
}