import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

function getToken(request: Request): string | undefined {
  const authHeader = request.headers.get('Authorization');
  const token = authHeader?.replace('Bearer ', '').trim();
  return token || undefined;
}

function getSupabaseClient(token?: string) {
  return createClient(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
    token ? { global: { headers: { Authorization: `Bearer ${token}` } } } : undefined
  );
}

export const GET: APIRoute = async ({ request }) => {
  const token = getToken(request);
  const supabase = getSupabaseClient(token);

  // Pass token explicitly — more reliable in server-side (no localStorage) context
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);

  if (authError || !user) {
    console.error('[GET /user-collection] Auth failed:', authError?.message ?? 'no user');
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { data, error } = await supabase
    .from('user_stickers')
    .select('sticker_id, status, marked_at')
    .eq('user_id', user.id);

  if (error) {
    console.error('[GET /user-collection] DB error:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const hasSet = new Set((data ?? []).map((r) => r.sticker_id));
  return new Response(JSON.stringify({ data, hasCount: hasSet.size }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

export const POST: APIRoute = async ({ request }) => {
  const token = getToken(request);
  const supabase = getSupabaseClient(token);

  const { data: { user }, error: authError } = await supabase.auth.getUser(token);

  if (authError || !user) {
    console.error('[POST /user-collection] Auth failed:', authError?.message ?? 'no user');
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let body: { sticker_id: number; status?: string };
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!body.sticker_id) {
    return new Response(JSON.stringify({ error: 'sticker_id is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('user_stickers')
    .upsert(
      {
        user_id: user.id,
        sticker_id: body.sticker_id,
        status: body.status ?? 'have',
        marked_at: now,
      },
      { onConflict: 'user_id,sticker_id' }
    )
    .select()
    .single();

  if (error) {
    console.error('[POST /user-collection] DB error:', error.message, '| details:', error.details, '| hint:', error.hint);
    return new Response(JSON.stringify({ error: error.message, details: error.details, hint: error.hint }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ data }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

export const DELETE: APIRoute = async ({ request }) => {
  const token = getToken(request);
  const supabase = getSupabaseClient(token);

  const { data: { user }, error: authError } = await supabase.auth.getUser(token);

  if (authError || !user) {
    console.error('[DELETE /user-collection] Auth failed:', authError?.message ?? 'no user');
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const url = new URL(request.url);
  const stickerId = url.searchParams.get('sticker_id');

  if (!stickerId) {
    return new Response(JSON.stringify({ error: 'sticker_id is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { error } = await supabase
    .from('user_stickers')
    .delete()
    .eq('user_id', user.id)
    .eq('sticker_id', Number(stickerId));

  if (error) {
    console.error('[DELETE /user-collection] DB error:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
