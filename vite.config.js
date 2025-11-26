import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'


export default defineConfig({
  assetsInclude: ['**/*.glb'],
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://jay-chatbot-4.onrender.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
        secure: false,
      }
    }
  }
})
