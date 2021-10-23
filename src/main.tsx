import Vue from 'vue';
import Antd from 'ant-design-vue';
import 'ant-design-vue/dist/antd.css';
import 'typeface-fira-sans'
import App from '@/App.vue';
import '@/assets/global.sass';
Vue.config.productionTip = false;

Vue.use(Antd);

/* eslint-disable no-new */
new Vue({
  el: '#app',
  components: { App },
  render(){
    return <App />
  }
});