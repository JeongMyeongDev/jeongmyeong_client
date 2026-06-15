import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: ['jeongmyeong.mirim-it-show.site'],
    proxy: {
      '/auth': 'http://localhost:3000',
      '/debates': 'http://localhost:3000',
      '/selection-targets': 'http://localhost:3000',
      '/consensuses': 'http://localhost:3000',
      '/posts': 'http://localhost:3000',
      '/comments': 'http://localhost:3000',
      '/definition-references': 'http://localhost:3000',
      '/definitions': 'http://localhost:3000',
      '/notifications': 'http://localhost:3000',
      '/users': 'http://localhost:3000',
    },
    hmr: {
      protocol: 'wss',
      host: 'jeongmyeong.mirim-it-show.site',
      clientPort: 443,
    },
  },
})
