import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const supabase = createClient(url, anon, {
    auth: { persistSession: false },
  });

  const { data, error, count } = await supabase
    .from('contacts')
    .select('id, slug, full_name', { count: 'exact' })
    .limit(5);

  return NextResponse.json({
    ok: !error,
    error: error?.message ?? null,
    count: count ?? null,
    sample: data ?? null,
  });
}
