import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://rcis-backend.onrender.com',
        changeOrigin: true,
        secure: true,
      },
      '/sms-gateway': {
        target: 'https://api.smsonlinegh.com/v5',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/sms-gateway/, '')
      }
    }
  }
})
