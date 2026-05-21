import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

function getSupabaseWithAuth(request: Request) {
  const authHeader = request.headers.get('Authorization');
  const token = authHeader?.replace('Bearer ', '');
  return createClient(
    import.meta.env.SUPABASE_URL,
    import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
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

  const { data, error } = await supabase
    .from('user_stickers')
    .select('sticker_id, status, marked_at')
    .eq('user_id', user.id);

  if (error) {
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
  const supabase = getSupabaseWithAuth(request);
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
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

  const { data, error } = await supabase
    .from('user_stickers')
    .upsert(
      {
        user_id: user.id,
        sticker_id: body.sticker_id,
        status: body.status ?? 'have',
      },
      { onConflict: 'user_id,sticker_id' }
    )
    .select()
    .single();

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
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
  const supabase = getSupabaseWithAuth(request);
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
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
