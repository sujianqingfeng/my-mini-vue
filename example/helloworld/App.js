import {h} from '../../lib/mini-vue.esm.js'
export default {

  render() {
    return h('div',{id:'div'},[
      h('p',{},'hello'),
      h('p',{},'mini-vue')
    ])
  },

  setup(){

    return {
      msg:'hello'
    }
  }

}