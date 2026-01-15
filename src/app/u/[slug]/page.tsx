import { Metadata } from "next";
import ProfileClient from "./profile-client";
import { createSupabaseServer } from "@/lib/supabase/server";

type Props = {
  params: Promise<{ slug: string }>;
};

// ✅ 1. ส่วน SEO
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createSupabaseServer();

  const { data: contact } = await supabase
    .from("contacts")
    .select("full_name, position, company, slug")
    .eq("slug", slug)
    .single();

  if (!contact) {
    return {
      title: "ไม่พบข้อมูลผู้ติดต่อ",
      description: "Graphic Station Contact Card",
    };
  }

  const title = `${contact.full_name}`;
  const description = `${contact.position || "Staff"} @ ${contact.company || "Graphic Station"}`;

  return {
    title: title,
    description: description,
    openGraph: {
      title: title,
      description: description,
    },
  };
}

// ✅ 2. ส่วนหน้าจอหลัก + Footer พร้อม Logo
export default async function Page({ params }: Props) {
  const { slug } = await params;
  const supabase = await createSupabaseServer();

  const { data, error } = await supabase
    .from("contacts")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error || !data) {
    return (
      <main style={{ padding: 16, color: "white", textAlign: "center" }}>
        <h1>ไม่พบข้อมูล</h1>
        <p>ลิงก์ไม่ถูกต้อง หรือโปรไฟล์ถูกลบแล้ว</p>
      </main>
    );
  }

  return (
    <>
      {/* ส่วนนามบัตร */}
      <ProfileClient contact={data} />

      {/* ส่วนที่อยู่บริษัท + Logo */}
      <footer
        style={{
          maxWidth: 860,
          margin: "0 auto",
          padding: "0 16px 60px", // เพิ่ม padding ล่างหน่อยเพื่อให้ไม่ชิดขอบจอเกินไป
          textAlign: "center",
          fontSize: 12,
          color: "rgba(255, 255, 255, 0.5)",
          lineHeight: 1.6,
        }}
      >
        {/* Logo Section */}
        <div style={{ marginBottom: 16 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src="/gs_logo_200.png" 
            alt="Graphic Station Logo" 
            style={{ 
              height: 50, 
              width: "auto", 
              opacity: 0.9,
              display: "inline-block" // จัดให้อยู่กึ่งกลางตาม parent text-align
            }} 
          />
        </div>

        <div style={{ fontWeight: 600, color: "rgba(255, 255, 255, 0.8)", marginBottom: 4 }}>
          บ.กราฟิก สเตชั่น จำกัด (สำนักงานใหญ่)
        </div>
        <div>
          27 ซอยพหลโยธิน25 ถ.พหลโยธิน แขวงจตุจักร เขตจตุจักร กรุงเทพฯ 10900
        </div>
        <div>
          โทรศัพท์ <a href="tel:02-930-3029" style={{ color: "inherit", textDecoration: "none" }}>02-930-3029</a>
        </div>
        <div>
          เลขประจำตัวผู้เสียภาษี 0105543093071
        </div>
      </footer>
    </>
  );
}