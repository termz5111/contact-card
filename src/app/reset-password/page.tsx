"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const [ready, setReady] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const [pw1, setPw1] = useState("");
  const [pw2, setPw2] = useState("");
  const [msg, setMsg] = useState<string>("");

  // กัน StrictMode (dev) ที่ทำให้ useEffect รัน 2 รอบ
  const didInit = useRef(false);

  const debug = useMemo(() => {
    const url = new URL(typeof window !== "undefined" ? window.location.href : "http://localhost");
    const hash = new URLSearchParams(url.hash.replace(/^#/, ""));
    return {
      hasCode: !!url.searchParams.get("code"),
      hasAccessTokenHash: !!hash.get("access_token"),
      hasRefreshTokenHash: !!hash.get("refresh_token"),
      hasTokenQuery: !!url.searchParams.get("token"),
      typeQuery: url.searchParams.get("type") || "",
    };
  }, []);

  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;

    (async () => {
      setMsg("");

      const url = new URL(window.location.href);
      const code = url.searchParams.get("code");

      let sessionOk = false;

      if (code) {
        // PKCE flow: ?code=...
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          setMsg(`exchangeCodeForSession error: ${error.message}`);
        } else if (data?.session) {
          sessionOk = true;
        }
      } else {
        // Implicit flow: #access_token=...&refresh_token=...
        const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
        const access_token = hash.get("access_token");
        const refresh_token = hash.get("refresh_token");

        if (access_token && refresh_token) {
          const { data, error } = await supabase.auth.setSession({ access_token, refresh_token });
          if (error) {
            setMsg(`setSession error: ${error.message}`);
          } else if (data?.session) {
            sessionOk = true;
          }
        }
      }

      if (sessionOk) {
        setHasSession(true);
        setMsg("พร้อมตั้งรหัสผ่าน ✅");

        // ล้าง URL หลังได้ session แล้วเท่านั้น (กันหลง + กัน token ค้าง)
        window.history.replaceState({}, document.title, "/reset-password");
      } else {
        // ตรวจว่ามี token มาไหม
        const urlNow = new URL(window.location.href);
        const hashNow = new URLSearchParams(urlNow.hash.replace(/^#/, ""));
        const hasAnyToken =
          !!urlNow.searchParams.get("code") ||
          !!hashNow.get("access_token") ||
          !!hashNow.get("refresh_token") ||
          !!urlNow.searchParams.get("token");

        setHasSession(false);

        // ถ้ายังไม่มี error message ที่ชัดเจน ให้แสดงข้อความมาตรฐาน
        setMsg((m) => {
          if (m) return m;
          return hasAnyToken
            ? "ยังสร้าง session ไม่สำเร็จ (token มาแต่แลก session ไม่ผ่าน) — กด Send password recovery ใหม่ แล้วคลิกลิงก์ล่าสุดทันที"
            : "หน้านี้เปิดตรง ๆ จะเปลี่ยนรหัสไม่ได้ ต้องเปิดจากลิงก์ในอีเมลที่มี token (เช่น ?code=... หรือ #access_token=...)";
        });
      }

      setReady(true);
    })();
  }, []);

  const submit = async () => {
    setMsg("");

    if (!hasSession) {
      setMsg("ไม่มี session จากลิงก์กู้รหัสผ่าน กรุณาส่งลิงก์ใหม่");
      return;
    }

    if (pw1.length < 8) {
      setMsg("รหัสผ่านต้องอย่างน้อย 8 ตัวอักษร");
      return;
    }

    if (pw1 !== pw2) {
      setMsg("รหัสผ่านสองช่องไม่ตรงกัน");
      return;
    }

    const { error } = await supabase.auth.updateUser({ password: pw1 });
    if (error) {
      setMsg(error.message);
      return;
    }

    setMsg("ตั้งรหัสผ่านสำเร็จแล้ว กำลังพาไปหน้าแอดมิน...");
    setTimeout(() => (window.location.href = "/admin"), 900);
  };

  if (!ready) return <main style={{ padding: 16 }}>กำลังโหลด...</main>;

  return (
    <main style={{ padding: 16, maxWidth: 520, margin: "0 auto" }}>
      <h1>ตั้งรหัสผ่านใหม่</h1>

      {msg ? (
        <p style={{ padding: 12, borderRadius: 12, background: "rgba(0,0,0,.06)" }}>{msg}</p>
      ) : null}

      <details style={{ marginTop: 10, opacity: 0.85 }}>
        <summary>Debug (ดูว่า token เข้ามาไหม)</summary>
        <pre style={{ whiteSpace: "pre-wrap" }}>
{JSON.stringify(
  {
    hasCode: debug.hasCode,
    hasAccessTokenHash: debug.hasAccessTokenHash,
    hasRefreshTokenHash: debug.hasRefreshTokenHash,
    hasTokenQuery: debug.hasTokenQuery,
    typeQuery: debug.typeQuery,
  },
  null,
  2
)}
        </pre>
      </details>

      <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
        <input
          type="password"
          placeholder="รหัสผ่านใหม่ (อย่างน้อย 8 ตัว)"
          value={pw1}
          onChange={(e) => setPw1(e.target.value)}
          style={{ padding: 12, borderRadius: 12, border: "1px solid rgba(0,0,0,.2)" }}
        />
        <input
          type="password"
          placeholder="ยืนยันรหัสผ่านใหม่"
          value={pw2}
          onChange={(e) => setPw2(e.target.value)}
          style={{ padding: 12, borderRadius: 12, border: "1px solid rgba(0,0,0,.2)" }}
        />

        <button
          onClick={submit}
          disabled={!hasSession}
          style={{
            padding: 12,
            borderRadius: 12,
            border: "none",
            cursor: hasSession ? "pointer" : "not-allowed",
            opacity: hasSession ? 1 : 0.6,
          }}
        >
          บันทึกรหัสผ่าน
        </button>
      </div>
    </main>
  );
}

