import ProfileClient from "./profile-client";
import { createSupabaseServer } from "@/lib/supabase/server";

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params; // ✅ Next ใหม่ต้อง await params
  const supabase = await createSupabaseServer(); // ✅ ตอนนี้เป็น async แล้ว

  const { data, error } = await supabase
    .from("contacts")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error || !data) {
    return (
      <main style={{ padding: 16 }}>
        <h1>ไม่พบข้อมูล</h1>
        <p>ลิงก์ไม่ถูกต้อง หรือโปรไฟล์ถูกลบแล้ว</p>
      </main>
    );
  }

  return <ProfileClient contact={data} />;
}
