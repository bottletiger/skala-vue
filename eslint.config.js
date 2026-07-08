import { defineConfig, globalIgnores } from 'eslint/config'
import globals from 'globals'
import js from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'
import pluginOxlint from 'eslint-plugin-oxlint'
import skipFormatting from 'eslint-config-prettier/flat'

export default defineConfig([
  {
    name: 'app/files-to-lint',
    files: ['**/*.{vue,js,mjs,jsx}'],
  },

  globalIgnores(['**/dist/**', '**/dist-ssr/**', '**/coverage/**']),

  {
    languageOptions: {
      globals: {
        ...globals.browser,
      },
    },
  },

  js.configs.recommended,
  ...pluginVue.configs['flat/essential'],

  ...pluginOxlint.buildFromOxlintConfigFile('.oxlintrc.json'),

  // 🟢 커스텀 규칙 설정 객체
  {
    name: 'app/custom-rules', // 규칙 묶음의 식별자 이름 (옵션)
    rules: {
      'no-unused-vars': 'warn', // 선언 후 사용하지 않은 변수는 경고 처리
      'no-console': 'off', // 개발 편의를 위해 console.log 허용
      'vue/multi-word-component-names': 'off', // 단일 단어로 된 컴포넌트명 허용
    },
  },

  skipFormatting,
])
