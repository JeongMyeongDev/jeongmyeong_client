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
  const proxyTarget = env.VITE_DEV_PROXY_TARGET || 'http://localhost:3000';
  const hmr =
    env.VITE_DEV_HMR_HOST || env.VITE_DEV_HMR_PROTOCOL || env.VITE_DEV_HMR_CLIENT_PORT
      ? {
          protocol: env.VITE_DEV_HMR_PROTOCOL,
          host: env.VITE_DEV_HMR_HOST,
          clientPort: env.VITE_DEV_HMR_CLIENT_PORT
            ? Number(env.VITE_DEV_HMR_CLIENT_PORT)
            : undefined,
        }
      : undefined;

  return {
    plugins: [react()],
    server: {
      allowedHosts: env.VITE_DEV_ALLOWED_HOST
        ? env.VITE_DEV_ALLOWED_HOST.split(',').map((host) => host.trim()).filter(Boolean)
        : undefined,
      proxy: Object.fromEntries(
        proxiedPaths.map((path) => [
          path,
          { target: proxyTarget, rewrite: (value: string) => `/api${value}` },
        ]),
      ),
      ...(hmr ? { hmr } : {}),
    },
  };
});
