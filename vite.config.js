import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  assetsInclude: ['**/*.glb'],
  plugins: [react()],
  server: {
    // Development proxy (only for local development)
    proxy: {
      '/api': {
        target: 'https://jaychatbot-jayacharanambati418-286zm8j4.leapcell.dev/',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
        secure: false,
      }
    }
  },
  build: {
    // Optimize for production
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'three-vendor': ['three', '@react-three/fiber', '@react-three/drei', '@react-three/rapier'],
          'animation-vendor': ['gsap', '@gsap/react']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  }
})
