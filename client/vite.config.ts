import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const useProxy = !env.VITE_API_URL;

  return {
    plugins: [react()],
    server: {
      proxy: useProxy
        ? {
            '/api': 'http://localhost:5000',
          }
        : undefined,
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true,
    },
  };
});
