"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

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
      <div className="mx-auto w-full max-w-5xl px-4 py-10">
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
            <div className="col-span-5">ชื่อ</div>
            <div className="col-span-4">ตำแหน่ง • บริษัท</div>
            <div className="col-span-2">slug</div>
            <div className="col-span-1 text-right">แก้ไข</div>
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
                  className="grid grid-cols-12 gap-2 px-6 py-5 text-sm text-neutral-900"
                >
                  <div className="col-span-5">
                    <div className="font-semibold text-neutral-900">{r.full_name}</div>
                  </div>

                  <div className="col-span-4">
                    <div className="text-neutral-900">
                      {(r.position || "-") + " • " + (r.company || "-")}
                    </div>
                  </div>

                  <div className="col-span-2">
                    <div className="font-medium text-neutral-900">{r.slug}</div>
                  </div>

                  <div className="col-span-1 flex justify-end">
                    <Link
                      href={`/admin/edit/${r.id}`}
                      className="rounded-full border border-neutral-300 bg-white px-4 py-1.5 text-xs font-semibold text-neutral-900 hover:bg-neutral-50"
                    >
                      Edit
                    </Link>
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

