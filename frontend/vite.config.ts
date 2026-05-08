import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/first-pass': 'http://127.0.0.1:8000',
      '/final-analysis': 'http://127.0.0.1:8000',
      '/download-pdf': 'http://127.0.0.1:8000',
      '/analyses': 'http://127.0.0.1:8000',
      '/static': 'http://127.0.0.1:8000',
    },
  },
})
