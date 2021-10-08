import {h} from '../../lib/mini-vue.esm.js'
export default {

  render() {
    return h('div',this.msg)
  },

  setup(){

    return {
      msg:'hello'
    }
  }

}