import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// ✅ สร้างครั้งเดียว (singleton)
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);

// เผื่อโค้ดเดิมเรียก createClient()
export function createClient() {
  return supabase;
}
