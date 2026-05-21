import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import vercel from '@astrojs/vercel';

export default defineConfig({
  integrations: [react()],
  output: 'server',
  adapter: vercel({
    webAnalytics: { enabled: false }
  }),
  vite: {
    ssr: {
      external: ['@supabase/supabase-js']
    }
  }
});
