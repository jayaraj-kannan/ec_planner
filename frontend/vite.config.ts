/// <reference types="vitest" />
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  envPrefix: ['VITE_', 'FIREBASE_'],
  build: {
    chunkSizeWarningLimit: 650,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('@firebase') || id.includes('firebase')) {
              return 'vendor-firebase';
            }
            if (id.includes('vue')) {
              return 'vendor-vue';
            }
            if (id.includes('lucide-vue-next')) {
              return 'vendor-icons';
            }
            if (id.includes('canvas-confetti')) {
              return 'vendor-confetti';
            }
          }
        },
      },
    },
  },
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

