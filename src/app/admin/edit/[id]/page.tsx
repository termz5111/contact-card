"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import ContactForm from "@/app/_components/ContactForm";

export default function AdminEditPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [loading, setLoading] = useState(true);
  const [initial, setInitial] = useState<any>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data, error } = await supabase.from("contacts").select("*").eq("id", id).single();
      if (error) {
        alert(`โหลดไม่สำเร็จ: ${error.message}`);
        setLoading(false);
        return;
      }
      setInitial(data);
      setLoading(false);
    })();
  }, [id]);

  if (loading) {
    return (
      <main className="min-h-screen p-6">
        <div className="mx-auto max-w-2xl rounded-2xl border p-6">กำลังโหลด…</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-6">
      <div className="mx-auto max-w-2xl">
        <ContactForm mode="edit" id={id} initial={initial} />
      </div>
    </main>
  );
}

