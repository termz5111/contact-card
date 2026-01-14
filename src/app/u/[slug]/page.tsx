import { supabase } from "@/lib/supabase/client";
import ProfileClient from "./profile-client";

export default async function Page({ params }: { params: { slug: string } }) {
  const { data, error } = await supabase
    .from("contacts")
    .select("*")
    .eq("slug", params.slug)
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

