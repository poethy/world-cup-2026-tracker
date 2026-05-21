import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

function getSupabaseWithAuth(request: Request) {
  const authHeader = request.headers.get('Authorization');
  const token = authHeader?.replace('Bearer ', '');
  return createClient(
    import.meta.env.SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY,
    token ? { global: { headers: { Authorization: `Bearer ${token}` } } } : undefined
  );
}

export const GET: APIRoute = async ({ request }) => {
  const supabase = getSupabaseWithAuth(request);
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Get user's stickers with sticker details
  const { data: userStickers, error } = await supabase
    .from('user_stickers')
    .select(`
      sticker_id,
      status,
      stickers (
        number,
        name,
        country,
        country_code,
        section_type,
        page_number
      )
    `)
    .eq('user_id', user.id);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const TOTAL_STICKERS = 980;
  const hasCount = userStickers?.length ?? 0;
  const missingCount = TOTAL_STICKERS - hasCount;
  const percentageComplete = Math.round((hasCount / TOTAL_STICKERS) * 100 * 10) / 10;

  // Group by country code
  const byCountry: Record<string, { country: string; has: number }> = {};
  for (const us of userStickers ?? []) {
    const sticker = (us as any).stickers;
    if (!sticker) continue;
    const cc = sticker.country_code;
    if (!byCountry[cc]) {
      byCountry[cc] = { country: sticker.country, has: 0 };
    }
    byCountry[cc].has++;
  }

  return new Response(
    JSON.stringify({
      hasCount,
      missingCount,
      totalStickers: TOTAL_STICKERS,
      percentageComplete,
      byCountry,
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }
  );
};
