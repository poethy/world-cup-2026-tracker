import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.SUPABASE_URL,
  import.meta.env.SUPABASE_SERVICE_ROLE_KEY
);

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const page = url.searchParams.get('page');
  const country = url.searchParams.get('country');
  const countryCode = url.searchParams.get('country_code');
  const section = url.searchParams.get('section');
  const limitParam = url.searchParams.get('limit');
  const offsetParam = url.searchParams.get('offset');

  const limit = Math.min(Number(limitParam) || 100, 500);
  const offset = Number(offsetParam) || 0;

  let query = supabase
    .from('stickers')
    .select('*')
    .order('number', { ascending: true })
    .range(offset, offset + limit - 1);

  if (page) {
    query = query.eq('page_number', Number(page));
  }

  if (country) {
    query = query.ilike('country', `%${country}%`);
  }

  if (countryCode) {
    query = query.eq('country_code', countryCode.toUpperCase());
  }

  if (section) {
    query = query.eq('section_type', section);
  }

  const { data, error, count } = await query;

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ data, count, limit, offset }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
};
