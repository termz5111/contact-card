import { NextResponse } from 'next/server';

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  return NextResponse.json({
    hasUrl: Boolean(url),
    urlHead: url.slice(0, 30),
    urlTail: url.slice(-12),
    keyTail: key.slice(-6),
  });
}
