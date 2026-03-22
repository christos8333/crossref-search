import { createApp } from 'vue';
import App from './App.vue';
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query';
import router from './router';
import './style.css';

const app = createApp(App);
app.use(router);
const queryClient = new QueryClient();
app.use(VueQueryPlugin, { queryClient });
app.mount('#app');
