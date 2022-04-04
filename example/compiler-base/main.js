import App from "./App.js";
import {createApp} from '../../lib/mini-vue.esm.js'

const container = document.querySelector('#app');
createApp(App).mount(container);
