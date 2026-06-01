import { sentryVitePlugin } from '@sentry/vite-plugin';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  const isVercelBuild = env.VERCEL === '1' || process.env.VERCEL === '1';
  const shouldUploadSourcemaps = Boolean(
    isVercelBuild &&
      env.SENTRY_AUTH_TOKEN &&
      env.SENTRY_ORG &&
      env.SENTRY_PROJECT,
  );

  return {
    plugins: [
      react(),
      tailwindcss(),
      shouldUploadSourcemaps &&
        sentryVitePlugin({
          authToken: env.SENTRY_AUTH_TOKEN,
          org: env.SENTRY_ORG,
          project: env.SENTRY_PROJECT,
          telemetry: false,
          sourcemaps: {
            filesToDeleteAfterUpload: ['dist/**/*.map'],
          },
        }),
    ].filter(Boolean),
    build: {
      sourcemap: shouldUploadSourcemaps ? 'hidden' : false,
    },
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
  };
});
