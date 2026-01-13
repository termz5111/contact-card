"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type ContactInput = {
  slug: string;
  full_name: string;
  position?: string;
  company?: string;
  phone?: string;
  email?: string;
  website?: string;
  line_id?: string;
  facebook?: string;
  instagram?: string;
  avatar_url?: string | null;
};

export default function ContactForm({
  mode,
  id,
  initial,
}: {
  mode: "create" | "edit";
  id?: string;
  initial?: Partial<ContactInput>;
}) {
  const router = useRouter();

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [fullName, setFullName] = useState(initial?.full_name ?? "");
  const [position, setPosition] = useState(initial?.position ?? "");
  const [company, setCompany] = useState(initial?.company ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [website, setWebsite] = useState(initial?.website ?? "");
  const [lineId, setLineId] = useState(initial?.line_id ?? "");
  const [facebook, setFacebook] = useState(initial?.facebook ?? "");
  const [instagram, setInstagram] = useState(initial?.instagram ?? "");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initial?.avatar_url ?? null);

  // ✅ UI classes: make everything readable + consistent
  const CARD = "rounded-3xl border border-zinc-200 bg-white p-5 text-zinc-900";
  const TITLE = "text-lg font-semibold text-zinc-900";
  const MUTED = "text-xs text-zinc-600"; // instead of opacity-70
  const LABEL = "text-xs font-medium text-zinc-700";
  const INPUT =
    "w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/20 focus:border-zinc-300";
  const BTN =
    "rounded-2xl bg-black px-4 py-2 text-sm text-white disabled:opacity-60 disabled:cursor-not-allowed";
  const BTN_FULL =
    "w-full rounded-2xl bg-black px-4 py-3 text-sm font-medium text-white disabled:opacity-60 disabled:cursor-not-allowed";

  // normalize slug
  const slugHint = useMemo(() => {
    const s = (slug || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-_]/g, "");
    return s;
  }, [slug]);

  useEffect(() => {
    if (mode === "create") return;
    // in edit mode keep as-is
  }, [mode]);

  async function uploadAvatar(file: File) {
    setUploading(true);
    try {
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) throw new Error("ยังไม่ได้ล็อกอิน");

      const safeName = file.name.replace(/[^\w.\-]+/g, "_");
      const path = `${slugHint || "no-slug"}/${Date.now()}_${safeName}`;

      const { error: upErr } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true, contentType: file.type });

      if (upErr) throw upErr;

      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      setAvatarUrl(data.publicUrl);
    } finally {
      setUploading(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    const payload: ContactInput = {
      slug: slugHint,
      full_name: fullName.trim(),
      position: position.trim() || undefined,
      company: company.trim() || undefined,
      phone: phone.trim() || undefined,
      email: email.trim() || undefined,
      website: website.trim() || undefined,
      line_id: lineId.trim() || undefined,
      facebook: facebook.trim() || undefined,
      instagram: instagram.trim() || undefined,
      avatar_url: avatarUrl || null,
    };

    if (!payload.slug) return alert("กรุณาใส่ slug");
    if (!payload.full_name) return alert("กรุณาใส่ชื่อ-นามสกุล");

    setSaving(true);
    try {
      if (mode === "create") {
        const { error } = await supabase.from("contacts").insert(payload);
        if (error) throw error;
      } else {
        if (!id) throw new Error("missing id");
        const { error } = await supabase.from("contacts").update(payload).eq("id", id);
        if (error) throw error;
      }

      router.push("/admin");
      router.refresh();
    } catch (err: any) {
      alert(`บันทึกไม่สำเร็จ: ${err?.message ?? String(err)}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3 text-zinc-900">
      <div className={CARD}>
        <div className="mb-3 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <div className={TITLE}>{mode === "create" ? "เพิ่มพนักงาน" : "แก้ไขข้อมูล"}</div>
            <div className={MUTED}>Public URL: /{slugHint || "slug"}</div>
          </div>

          <button type="submit" disabled={saving || uploading} className={BTN}>
            {saving ? "กำลังบันทึก…" : "บันทึก"}
          </button>
        </div>

        <div className="grid gap-3">
          <label className="grid gap-1">
            <span className={LABEL}>Slug (ลิงก์สั้น)</span>
            <input
              className={INPUT}
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="เช่น termz"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
            />
            <div className={MUTED}>ระบบจะปรับเป็น: {slugHint || "-"}</div>
          </label>

          <label className="grid gap-1">
            <span className={LABEL}>ชื่อ นามสกุล</span>
            <input
              className={INPUT}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Termpong Sangkeo"
            />
          </label>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <label className="grid gap-1">
              <span className={LABEL}>ตำแหน่ง</span>
              <input className={INPUT} value={position} onChange={(e) => setPosition(e.target.value)} />
            </label>
            <label className="grid gap-1">
              <span className={LABEL}>บริษัท</span>
              <input className={INPUT} value={company} onChange={(e) => setCompany(e.target.value)} />
            </label>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <label className="grid gap-1">
              <span className={LABEL}>โทร</span>
              <input className={INPUT} value={phone} onChange={(e) => setPhone(e.target.value)} />
            </label>
            <label className="grid gap-1">
              <span className={LABEL}>Email</span>
              <input className={INPUT} value={email} onChange={(e) => setEmail(e.target.value)} />
            </label>
          </div>

          <label className="grid gap-1">
            <span className={LABEL}>Website</span>
            <input className={INPUT} value={website} onChange={(e) => setWebsite(e.target.value)} />
          </label>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <label className="grid gap-1">
              <span className={LABEL}>Line ID</span>
              <input className={INPUT} value={lineId} onChange={(e) => setLineId(e.target.value)} />
            </label>
            <label className="grid gap-1">
              <span className={LABEL}>Facebook</span>
              <input className={INPUT} value={facebook} onChange={(e) => setFacebook(e.target.value)} />
            </label>
            <label className="grid gap-1">
              <span className={LABEL}>Instagram</span>
              <input className={INPUT} value={instagram} onChange={(e) => setInstagram(e.target.value)} />
            </label>
          </div>

          <div className="mt-2 rounded-2xl border border-zinc-200 p-4">
            <div className="mb-2 text-xs font-semibold text-zinc-700">รูปโปรไฟล์</div>

            <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
              <div className="h-16 w-16 overflow-hidden rounded-2xl bg-zinc-100 ring-1 ring-zinc-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {avatarUrl ? (
                  <img src={avatarUrl} alt="avatar" className="h-full w-full object-cover" />
                ) : (
                  <div className="grid h-full w-full place-items-center text-zinc-500">👤</div>
                )}
              </div>

              <input
                className="text-sm text-zinc-700 file:mr-3 file:rounded-xl file:border-0 file:bg-zinc-900 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-zinc-800"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) uploadAvatar(f).catch((err) => alert(err?.message ?? String(err)));
                }}
              />

              <div className={MUTED}>
                {uploading ? "กำลังอัปโหลด…" : avatarUrl ? "อัปโหลดแล้ว" : "ยังไม่มีรูป"}
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button type="submit" disabled={saving || uploading} className={BTN_FULL}>
              {saving ? "กำลังบันทึก…" : "บันทึก"}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}

