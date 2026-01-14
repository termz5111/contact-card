import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  if (!url || !anon) {
    return NextResponse.json(
      { ok: false, error: 'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY' },
      { status: 500 }
    );
  }

  const supabase = createClient(url, anon, {
    auth: { persistSession: false },
  });

  // ปรับ select fields ให้ “มีจริง” ในตารางคุณ:
  // จากรูปคุณมี full_name และ slug แน่ ๆ (id มักมี)
  const { data, error, count } = await supabase
    .from('contacts')
    .select('id, slug, full_name', { count: 'exact' })
    .limit(10);

  return NextResponse.json({
    ok: !error,
    error: error?.message ?? null,
    count: count ?? null,
    sample: data ?? null,
  });
}
