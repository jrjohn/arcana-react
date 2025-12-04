import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@core': path.resolve(__dirname, './src/app/core'),
      '@domain': path.resolve(__dirname, './src/app/domain'),
      '@data': path.resolve(__dirname, './src/app/data'),
      '@presentation': path.resolve(__dirname, './src/app/presentation'),
      '@shared': path.resolve(__dirname, './src/app/presentation/shared'),
      '@assets': path.resolve(__dirname, './src/assets'),
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        silenceDeprecations: ['legacy-js-api'],
      },
    },
  },
})
