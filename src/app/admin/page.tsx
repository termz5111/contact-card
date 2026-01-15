"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

type ContactRow = {
  id: string;
  slug: string;
  full_name: string;
  position: string | null;
  company: string | null;
  created_at?: string;
};

export default function AdminPage() {
  const router = useRouter();
  const [email, setEmail] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<ContactRow[]>([]);
  const [q, setQ] = useState("");

  async function loadSession() {
    const { data } = await supabase.auth.getUser();
    setEmail(data.user?.email ?? "");
  }

  async function loadContacts() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("contacts")
        .select("id,slug,full_name,position,company,created_at")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRows((data ?? []) as ContactRow[]);
    } catch (err: any) {
      alert(`โหลดไม่สำเร็จ: ${err?.message ?? String(err)}`);
    } finally {
      setLoading(false);
    }
  }

  // ฟังก์ชันลบข้อมูล
  async function handleDelete(id: string, name: string) {
    if (!confirm(`คุณต้องการลบข้อมูลของ "${name}" ใช่หรือไม่?`)) return;

    try {
      const { error } = await supabase.from("contacts").delete().eq("id", id);
      if (error) throw error;

      setRows((prev) => prev.filter((r) => r.id !== id));
      alert("ลบข้อมูลสำเร็จ");
    } catch (err: any) {
      alert(`ลบไม่สำเร็จ: ${err?.message ?? String(err)}`);
    }
  }

  // ✅ ฟังก์ชัน Copy Link
  async function handleCopyLink(slug: string) {
    const url = `https://card.graphic-station.net/u/${slug}`;
    try {
      await navigator.clipboard.writeText(url);
      // แจ้งเตือนเล็กน้อย
      alert(`คัดลอกลิงก์แล้ว:\n${url}`);
    } catch (err) {
      console.error("Copy failed", err);
      alert("เกิดข้อผิดพลาดในการคัดลอก");
    }
  }

  useEffect(() => {
    (async () => {
      await loadSession();
      await loadContacts();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter((r) => {
      const hay = `${r.full_name ?? ""} ${r.slug ?? ""} ${r.company ?? ""} ${r.position ?? ""}`.toLowerCase();
      return hay.includes(s);
    });
  }, [q, rows]);

  async function logout() {
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="mx-auto w-full max-w-6xl px-4 py-10"> {/* ขยายความกว้างรวมเป็น max-w-6xl เพื่อให้ปุ่มไม่อึดอัด */}
        
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-white">Contacts Admin</h1>
            <div className="mt-1 text-sm text-white/80">
              Logged in: <span className="font-medium text-white">{email || "-"}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/admin/new"
              className="rounded-full border border-white/40 bg-white/10 px-5 py-2.5 text-sm font-medium text-white hover:bg-white/15"
            >
              + เพิ่มพนักงาน
            </Link>
            <button
              onClick={logout}
              className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-black hover:bg-white/90"
            >
              ออกจากระบบ
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="mt-6">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="ค้นหา: ชื่อ / slug / บริษัท / ตำแหน่ง"
            className="w-full rounded-3xl border border-white/35 bg-black px-6 py-4 text-base text-white placeholder:text-white/50 outline-none focus:border-white/60"
          />
        </div>

        {/* Table */}
        <div className="mt-6 overflow-hidden rounded-3xl border border-white/15 bg-white">
          <div className="grid grid-cols-12 gap-2 border-b bg-white px-6 py-4 text-sm font-semibold text-neutral-900">
            {/* ปรับ Layout Grid ใหม่: 3 + 3 + 2 + 4 = 12 */}
            <div className="col-span-3">ชื่อ</div>
            <div className="col-span-3">ตำแหน่ง • บริษัท</div>
            <div className="col-span-2">slug</div>
            <div className="col-span-4 text-right">จัดการ</div>
          </div>

          {loading ? (
            <div className="px-6 py-10 text-center text-sm font-medium text-neutral-900">
              กำลังโหลด…
            </div>
          ) : filtered.length === 0 ? (
            <div className="px-6 py-10 text-center text-sm text-neutral-700">
              ไม่พบข้อมูล
            </div>
          ) : (
            <div className="divide-y">
              {filtered.map((r) => (
                <div
                  key={r.id}
                  className="grid grid-cols-12 gap-2 px-6 py-5 text-sm text-neutral-900 items-center"
                >
                  <div className="col-span-3">
                    <div className="font-semibold text-neutral-900 truncate" title={r.full_name}>
                      {r.full_name}
                    </div>
                  </div>

                  <div className="col-span-3">
                    <div className="text-neutral-900 truncate" title={(r.position || "") + " " + (r.company || "")}>
                      {(r.position || "-") + " • " + (r.company || "-")}
                    </div>
                  </div>

                  <div className="col-span-2">
                    <div className="font-medium text-neutral-900 truncate">{r.slug}</div>
                  </div>

                  {/* Action Buttons */}
                  <div className="col-span-4 flex justify-end gap-2">
                    
                    {/* ปุ่ม Copy Link (สีน้ำเงิน) */}
                    <button
                      onClick={() => handleCopyLink(r.slug)}
                      className="rounded-full border border-blue-200 bg-white px-3 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-50 hover:border-blue-300 transition whitespace-nowrap"
                    >
                      Copy Link
                    </button>

                    {/* ปุ่ม Edit (สีเทา) */}
                    <Link
                      href={`/admin/edit/${r.id}`}
                      className="rounded-full border border-neutral-300 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-900 hover:bg-neutral-50 transition"
                    >
                      Edit
                    </Link>

                    {/* ปุ่ม Delete (สีแดง) */}
                    <button
                      onClick={() => handleDelete(r.id, r.full_name)}
                      className="rounded-full border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 hover:border-red-300 transition"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6 text-sm text-white/70">
          Public URL ตัวอย่าง: <span className="font-mono text-white">/{`{slug}`}</span>
        </div>
      </div>
    </div>
  );
}