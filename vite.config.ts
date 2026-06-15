import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: ['jeongmyeong.mirim-it-show.site'],
    proxy: {
      '/auth': { target: 'http://localhost:3000', rewrite: (path) => `/api${path}` },
      '/debates': { target: 'http://localhost:3000', rewrite: (path) => `/api${path}` },
      '/selection-targets': { target: 'http://localhost:3000', rewrite: (path) => `/api${path}` },
      '/consensuses': { target: 'http://localhost:3000', rewrite: (path) => `/api${path}` },
      '/posts': { target: 'http://localhost:3000', rewrite: (path) => `/api${path}` },
      '/comments': { target: 'http://localhost:3000', rewrite: (path) => `/api${path}` },
      '/definition-references': { target: 'http://localhost:3000', rewrite: (path) => `/api${path}` },
      '/definitions': { target: 'http://localhost:3000', rewrite: (path) => `/api${path}` },
      '/notifications': { target: 'http://localhost:3000', rewrite: (path) => `/api${path}` },
      '/users': { target: 'http://localhost:3000', rewrite: (path) => `/api${path}` },
    },
    hmr: {
      protocol: 'wss',
      host: 'jeongmyeong.mirim-it-show.site',
      clientPort: 443,
    },
  },
})
