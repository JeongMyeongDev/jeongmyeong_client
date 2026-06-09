import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: ['jeongmyeong.mirim-it-show.site'],
    hmr: {
      protocol: 'wss',
      host: 'jeongmyeong.mirim-it-show.site',
      clientPort: 443,
    },
  },
})
