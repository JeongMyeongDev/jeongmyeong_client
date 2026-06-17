import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

const proxiedPaths = [
  '/auth',
  '/debates',
  '/selection-targets',
  '/consensuses',
  '/posts',
  '/comments',
  '/definition-references',
  '/definitions',
  '/notifications',
  '/users',
] as const;

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  const proxyTarget =
    env.VITE_PROXY_TARGET ||
    env.VITE_DEV_PROXY_TARGET ||
    'http://localhost:3000';

  const disableHmr = env.VITE_DISABLE_HMR === 'true';

  const hmr =
    !disableHmr &&
    (env.VITE_HMR_HOST ||
      env.VITE_HMR_PROTOCOL ||
      env.VITE_HMR_CLIENT_PORT ||
      env.VITE_DEV_HMR_HOST ||
      env.VITE_DEV_HMR_PROTOCOL ||
      env.VITE_DEV_HMR_CLIENT_PORT)
      ? {
          protocol: env.VITE_HMR_PROTOCOL || env.VITE_DEV_HMR_PROTOCOL,
          host: env.VITE_HMR_HOST || env.VITE_DEV_HMR_HOST,
          clientPort: env.VITE_HMR_CLIENT_PORT || env.VITE_DEV_HMR_CLIENT_PORT
            ? Number(env.VITE_HMR_CLIENT_PORT || env.VITE_DEV_HMR_CLIENT_PORT)
            : undefined,
        }
      : undefined;

  const allowedHostRaw =
    env.VITE_ALLOWED_HOST || env.VITE_DEV_ALLOWED_HOST;

  return {
    plugins: [react()],
    server: {
      host: '0.0.0.0',
      port: 5173,
      allowedHosts: allowedHostRaw
        ? allowedHostRaw
            .split(',')
            .map((host) => host.trim())
            .filter(Boolean)
        : undefined,
      proxy: Object.fromEntries(
        proxiedPaths.map((path) => [
          path,
          {
            target: proxyTarget,
            changeOrigin: true,
            rewrite: (value: string) => `/api${value}`,
          },
        ]),
      ),
      ...(hmr ? { hmr } : {}),
    },
  };
});