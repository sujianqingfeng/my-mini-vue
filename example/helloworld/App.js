import {h} from '../../lib/mini-vue.esm.js'
export default {

  render() {
    return h('div',
    {
      id:'div',
      onClick:()=>{
        console.log('click');
      }
    },
    [
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