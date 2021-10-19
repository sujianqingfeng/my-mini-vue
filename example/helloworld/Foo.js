
import {h} from '../../lib/mini-vue.esm.js'

export const Foo = {
  setup(props){
    props.count ++ 
    console.log(props)
  },

  render(){

    return h('div',{},`Foo:${this.count}`)

  }
}