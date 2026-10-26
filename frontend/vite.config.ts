/// <reference types="vitest" />
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'happy-dom',
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/components/**/*.{vue,ts}', 'src/stores/**/*.{ts}'],
      exclude: ['src/components/**/__tests__/**', 'src/stores/**/__tests__/**'],
    },
  },
})

