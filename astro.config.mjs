import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';

const posthogAssetHost = 'https://eu-assets.i.posthog.com';
const posthogApiHost = 'https://eu.i.posthog.com';

export default defineConfig({
  site: 'https://postlabel.neveroff.dev',
  output: 'static',
  adapter: vercel(),
  integrations: [react(), tailwind(), sitemap()],
  vite: {
    server: {
      proxy: {
        '/plb/static': {
          target: posthogAssetHost,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/plb/, ''),
        },
        '/plb/array': {
          target: posthogAssetHost,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/plb/, ''),
        },
        '/plb': {
          target: posthogApiHost,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/plb/, ''),
        },
      },
    },
  },
});
