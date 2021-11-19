import {createRenderer} from '../../lib/mini-vue.esm.js'
import App from './App.js'



 const application = new PIXI.Application({ width: 640, height: 360 });
 document.body.appendChild(application.view);


const renderer = createRenderer({
  createElement(type){
    console.log('createElement',type)

    if(type==='rect'){
      const rect = new PIXI.Graphics();
      rect.beginFill(0xff0000);
      rect.drawRect(0, 0, 200, 100);

      return rect
    }
  },
  patchProp(el,key,val){
    console.log('patchProp',el,key,val);
    el[key] = val
  },
  insert(el,parent){
    console.log('insert',el,parent);
    parent.addChild(el)
  }
})



renderer.createApp(App).mount(application.stage)