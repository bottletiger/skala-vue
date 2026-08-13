import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// 🟢 ({ mode }) => { return { ... } } 형태로 변경
export default defineConfig(({ mode }) => {
  return {
    plugins: [
      vue(),
      vueDevTools({
        appendTo: 'src/main.js',
      }),
    ],
    define: {
      __VUE_PROD_DEVTOOLS__: true,
      // 🟢 이제 mode 변수를 안전하게 사용할 수 있습니다.
      'process.env.NODE_ENV': JSON.stringify(mode === 'production' ? 'development' : mode),
    },
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      port: 3000,
      open: true,
    },
    build: {
      outDir: 'dist',
    },
  }
})
