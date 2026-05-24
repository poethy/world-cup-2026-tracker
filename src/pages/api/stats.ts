import type { APIRoute } from 'astro';
import { supabase } from '../../utils/supabase';

export const GET: APIRoute = async () => {
  const { data, error } = await supabase
    .from('stickers')
    .select('country_code, country, section_type');

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const totalStickers = data.length;
  const byCountry: Record<string, { country: string; count: number }> = {};
  const distribution: Record<string, number> = { regular: 0, special: 0 };

  for (const s of data) {
    if (!byCountry[s.country_code]) {
      byCountry[s.country_code] = { country: s.country, count: 0 };
    }
    byCountry[s.country_code].count++;
    distribution[s.section_type] = (distribution[s.section_type] || 0) + 1;
  }

  return new Response(
    JSON.stringify({ totalStickers, byCountry, distribution }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    }
  );
};
