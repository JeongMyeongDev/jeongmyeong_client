import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
<<<<<<< HEAD
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: [
      'jeongmyeong.mirim-it-show.site'
    ]
  }
=======
    allowedHosts: ['jeongmyeong.mirim-it-show.site'], 
  },
>>>>>>> main
})
