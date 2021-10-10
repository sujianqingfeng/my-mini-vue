import {h} from '../../lib/mini-vue.esm.js'
window.self = null
export default {

  render() {
    window.self = this
    return h('div',{id:'div'},[
      h('p',{},this.msg),
      h('p',{},'mini-vue')
    ])
  },

  setup(){

    return {
      msg:'hello'
    }
  }

}