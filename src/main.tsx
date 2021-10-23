import Vue from 'vue';
import Antd from 'ant-design-vue';
import 'ant-design-vue/dist/antd.css';
import 'typeface-fira-sans';

Vue.config.productionTip = false;

Vue.use(Antd);

/* eslint-disable no-new */
new Vue({
  el: '#app',
  render(){
    return <a-button>Bienvenidos a WorkSpace!</a-button>
  }
});