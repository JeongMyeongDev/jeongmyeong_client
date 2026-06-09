import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiProxyTarget = env.VITE_API_PROXY_TARGET || 'http://localhost:3000';
  const hmrDisabled = env.VITE_DISABLE_HMR === 'true';
  const hmrHost = env.VITE_HMR_HOST;
  const hmrConfig = hmrDisabled
    ? false
    : hmrHost
      ? {
          protocol: env.VITE_HMR_PROTOCOL || 'wss',
          host: hmrHost,
          clientPort: Number(env.VITE_HMR_CLIENT_PORT || 443),
        }
      : undefined;

  return {
    plugins: [react()],
    server: {
      allowedHosts: ['jeongmyeong.mirim-it-show.site'],
      ...(hmrConfig !== undefined ? { hmr: hmrConfig } : {}),
      proxy: {
        '/api': {
          target: apiProxyTarget,
          changeOrigin: true,
        },
      },
    },
  };
})
