"use client";

import { useEffect, useMemo, useState } from "react";

function decodeJwtPayload(jwt: string) {
  try {
    const payload = jwt.split(".")[1];
    // base64url -> base64 (+ padding)
    const b64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const pad = "=".repeat((4 - (b64.length % 4)) % 4);
    const bin = atob(b64 + pad);
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    const json = new TextDecoder().decode(bytes);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export default function DebugPage() {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
  const key = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").trim();

  const info = useMemo(() => {
    const payload = key ? decodeJwtPayload(key) : null;
    return {
      url,
      keyPrefix: key ? key.slice(0, 10) : "",
      keyLength: key ? key.length : 0,
      keyDotCount: (key.match(/\./g) || []).length,
      keyHas3Parts: key.split(".").length === 3,
      partLengths: key.split(".").map((p) => p.length),
      jwtRef: payload?.ref || null,
      jwtRole: payload?.role || null,
      jwtIss: payload?.iss || null,
    };
  }, [url, key]);

  const [apiTest, setApiTest] = useState<any>(null);

  useEffect(() => {
    (async () => {
      if (!url || !key) {
        setApiTest({ ok: false, note: "missing url/key" });
        return;
      }

      try {
        const res = await fetch(`${url}/auth/v1/settings`, {
          headers: {
            apikey: key,
            Authorization: `Bearer ${key}`,
          },
        });

        const text = await res.text();
        setApiTest({
          status: res.status,
          ok: res.ok,
          // โชว์แค่บางส่วนพอ ไม่ต้องยาว
          bodyPreview: text.slice(0, 200),
        });
      } catch (e: any) {
        setApiTest({ ok: false, error: e?.message || String(e) });
      }
    })();
  }, [url, key]);

  return (
    <main style={{ padding: 16 }}>
      <h1>/debug</h1>

      <h3>ENV</h3>
      <pre style={{ whiteSpace: "pre-wrap" }}>{JSON.stringify(info, null, 2)}</pre>

      <h3>API self-test: GET /auth/v1/settings</h3>
      <p>ถ้า key ถูกต้องควรได้ 200 / ok:true</p>
      <pre style={{ whiteSpace: "pre-wrap" }}>{JSON.stringify(apiTest, null, 2)}</pre>
    </main>
  );
}
