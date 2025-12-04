/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        'src/main.tsx',
        'src/vite-env.d.ts',
      ],
    },
  },
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
})
