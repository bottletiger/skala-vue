import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import {
  Close,
  InfoFilled,
  LocationInformation,
  Search,
  Star,
  StarFilled,
  View,
} from '@element-plus/icons-vue'

const app = createApp(App)
const icons = {
  Close,
  InfoFilled,
  LocationInformation,
  Search,
  Star,
  StarFilled,
  View,
}

for (const [name, component] of Object.entries(icons)) {
  app.component(name, component)
}

app.use(createPinia())
app.use(router)

app.mount('#app')
