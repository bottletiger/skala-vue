import 'element-plus/dist/index.css'
import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { ElEmpty, ElResult, ElSkeleton } from 'element-plus'

import App from './App.vue'
import router from './router'

const app = createApp(App)

app.use(createPinia())
app.use(router)
;[ElEmpty, ElResult, ElSkeleton].forEach((component) => {
  app.component(component.name, component)
})

app.mount('#app')
