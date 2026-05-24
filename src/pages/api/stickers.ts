import type { APIRoute } from 'astro';
import { supabase } from '../../utils/supabase';

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const page        = url.searchParams.get('page');
  const country     = url.searchParams.get('country');
  const countryCode = url.searchParams.get('country_code');
  const section     = url.searchParams.get('section');
  const limitParam  = url.searchParams.get('limit');
  const offsetParam = url.searchParams.get('offset');

  const limit  = Math.min(Number(limitParam)  || 100, 500);
  const offset = Number(offsetParam) || 0;

  let query = supabase.from('stickers').select('*', { count: 'exact' });

  if (page)        query = query.eq('page_number', Number(page));
  if (countryCode) query = query.eq('country_code', countryCode.toUpperCase());
  if (section)     query = query.eq('section_type', section);
  if (country)     query = query.ilike('country', `%${country}%`);

  const { data, count, error } = await query
    .order('number', { ascending: true })
    .range(offset, offset + limit - 1);

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
