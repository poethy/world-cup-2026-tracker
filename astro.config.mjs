import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

const isVercel = process.env.VERCEL === '1';

const config = {
  integrations: [react()],
  output: 'server',
  vite: {
    ssr: {
      external: ['@supabase/supabase-js']
    }
  }
};

if (isVercel) {
  const vercel = (await import('@astrojs/vercel')).default;
  config.adapter = vercel({ webAnalytics: { enabled: false } });
}

export default defineConfig(config);
