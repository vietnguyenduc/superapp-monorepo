import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@superapp/shared-utils': fileURLToPath(new URL('../../packages/shared-utils/src', import.meta.url)),
      '@superapp/iam': fileURLToPath(new URL('../../packages/iam/src', import.meta.url)),
      '@repo/types': fileURLToPath(new URL('../../packages/types/src', import.meta.url)),
    },
    dedupe: ['react', 'react-dom'],
  },
  server: {
    host: true,
    port: 5174,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
  css: {
    postcss: './postcss.config.cjs',
  },
})
