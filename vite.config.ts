import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      { find: '@', replacement: path.resolve(__dirname, './src') },
      { find: '@core', replacement: path.resolve(__dirname, './src/app/core') },
      { find: '@domain', replacement: path.resolve(__dirname, './src/app/domain') },
      { find: '@data', replacement: path.resolve(__dirname, './src/app/data') },
      { find: '@presentation', replacement: path.resolve(__dirname, './src/app/presentation') },
      { find: '@shared', replacement: path.resolve(__dirname, './src/app/presentation/shared') },
      { find: '@assets', replacement: path.resolve(__dirname, './src/assets') },
    ],
  },
  css: {
    preprocessorOptions: {
      scss: {
        silenceDeprecations: ['legacy-js-api'],
      },
    },
  },
})
