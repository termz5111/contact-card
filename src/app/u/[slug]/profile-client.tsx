"use client";

import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";

type Contact = {
  slug: string;
  full_name: string;
  position?: string | null;
  company?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  line_id?: string | null;
  facebook?: string | null;
  instagram?: string | null;

  photo_url?: string | null;   // อาจเป็น url หรือ path หรือ null
  avatar_url?: string | null;  // ของคุณเป็น full URL
};

const normUrl = (v?: string | null) => {
  const s = (v || "").trim();
  if (!s) return "";
  if (/^https?:\/\//i.test(s)) return s;
  return `https://${s}`;
};
const normTel = (v?: string | null) => (v || "").trim().replace(/[^0-9+]/g, "");
const normLine = (v?: string | null) => {
  const s = (v || "").trim().replace(/^@+/, "");
  if (!s) return "";
  if (/^https?:\/\//i.test(s) || /^line:\/\//i.test(s)) return s;
  return `https://line.me/R/ti/p/~${s}`;
};
const normFb = (v?: string | null) => {
  const s = (v || "").trim();
  if (!s) return "";
  if (/^https?:\/\//i.test(s)) return s;
  return `https://facebook.com/${s.replace(/^@+/, "")}`;
};
const normIg = (v?: string | null) => {
  const s = (v || "").trim();
  if (!s) return "";
  if (/^https?:\/\//i.test(s)) return s;
  return `https://instagram.com/${s.replace(/^@+/, "")}`;
};

const prettyUrl = (u?: string | null) => {
  const url = normUrl(u);
  if (!url) return "";
  try {
    const x = new URL(url);
    return (x.host + x.pathname).replace(/\/$/, "");
  } catch {
    return url;
  }
};

function vcfEscape(v: string) {
  return (v || "")
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

function buildVCard(c: Contact) {
  const lines: string[] = [];
  lines.push("BEGIN:VCARD");
  lines.push("VERSION:3.0");
  lines.push(`FN:${vcfEscape(c.full_name || "")}`);
  if (c.company) lines.push(`ORG:${vcfEscape(c.company)}`);
  if (c.position) lines.push(`TITLE:${vcfEscape(c.position)}`);
  if (c.phone) lines.push(`TEL;TYPE=CELL:${vcfEscape(normTel(c.phone))}`);
  if (c.email) lines.push(`EMAIL;TYPE=INTERNET:${vcfEscape(c.email.trim())}`);
  if (c.website) lines.push(`URL:${vcfEscape(normUrl(c.website))}`);
  if (c.line_id) lines.push(`X-SOCIALPROFILE;type=line:${vcfEscape(normLine(c.line_id))}`);
  if (c.facebook) lines.push(`X-SOCIALPROFILE;type=facebook:${vcfEscape(normFb(c.facebook))}`);
  if (c.instagram) lines.push(`X-SOCIALPROFILE;type=instagram:${vcfEscape(normIg(c.instagram))}`);
  lines.push("END:VCARD");
  return lines.join("\n");
}

type Action = {
  key: string;
  label: string;
  value: string;
  href: string;
  targetBlank?: boolean;
};

export default function ProfileClient({ contact }: { contact: Contact }) {
  const [qr, setQr] = useState<string>("");

  useEffect(() => {
    (async () => {
      try {
        const href = window.location.href;
        const dataUrl = await QRCode.toDataURL(href, { margin: 1, scale: 6 });
        setQr(dataUrl);
      } catch {}
    })();
  }, []);

  const subtitle =
    [contact.position, contact.company].filter(Boolean).join(" • ") || "—";

  const photoSrc = useMemo(() => {
    const a = (contact.avatar_url || "").trim();
    if (a && /^https?:\/\//i.test(a)) return a;

    const p = (contact.photo_url || "").trim();
    if (p && /^https?:\/\//i.test(p)) return p;

    return "";
  }, [contact.avatar_url, contact.photo_url]);

  // ✅ จุดสำคัญ: actions มีทั้ง label + value แล้ว render ออกมาจริง
  const actions: Action[] = useMemo(() => {
    const phone = (contact.phone || "").trim();
    const email = (contact.email || "").trim();
    const website = (contact.website || "").trim();
    const lineId = (contact.line_id || "").trim();
    const fb = (contact.facebook || "").trim();
    const ig = (contact.instagram || "").trim();

    const list: Action[] = [];

    if (phone) {
      list.push({
        key: "phone",
        label: "📞 โทร",
        value: phone,
        href: `tel:${normTel(phone)}`,
      });
    }
    if (email) {
      list.push({
        key: "email",
        label: "✉️ Email",
        value: email,
        href: `mailto:${email}`,
      });
    }
    if (website) {
      list.push({
        key: "website",
        label: "🌐 Website",
        value: prettyUrl(website),
        href: normUrl(website),
        targetBlank: true,
      });
    }
    if (lineId) {
      list.push({
        key: "line",
        label: "💬 Line",
        value: lineId.replace(/^@+/, ""),
        href: normLine(lineId),
        targetBlank: true,
      });
    }
    if (fb) {
      list.push({
        key: "facebook",
        label: "📘 Facebook",
        value: prettyUrl(normFb(fb)),
        href: normFb(fb),
        targetBlank: true,
      });
    }
    if (ig) {
      list.push({
        key: "instagram",
        label: "📷 Instagram",
        value: prettyUrl(normIg(ig)),
        href: normIg(ig),
        targetBlank: true,
      });
    }

    return list;
  }, [
    contact.phone,
    contact.email,
    contact.website,
    contact.line_id,
    contact.facebook,
    contact.instagram,
  ]);

  const downloadVCF = () => {
    const vcf = buildVCard(contact);
    const blob = new Blob([vcf], { type: "text/vcard;charset=utf-8" });
    const objUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = objUrl;
    a.download = `${(contact.full_name || "contact").replace(/\s+/g, "_")}.vcf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(objUrl);
  };

  return (
    <main style={{ padding: 16, maxWidth: 860, margin: "0 auto" }}>
      <section
        style={{
          border: "1px solid rgba(255,255,255,.10)",
          borderRadius: 22,
          padding: 18,
          backdropFilter: "blur(10px)",
          background: "rgba(0,0,0,.25)",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
          <div
            style={{
              width: 76,
              height: 76,
              borderRadius: 18,
              overflow: "hidden",
              background: "rgba(255,255,255,.06)",
              display: "grid",
              placeItems: "center",
              flex: "0 0 auto",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {photoSrc ? (
              <img
                src={photoSrc}
                alt={contact.full_name}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = "none";
                }}
              />
            ) : (
              <span style={{ fontSize: 30 }}>👤</span>
            )}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{ margin: 0, fontSize: 22 }}>{contact.full_name}</h1>
            <p style={{ margin: "6px 0 0", opacity: 0.75 }}>{subtitle}</p>
          </div>
        </div>

        {/* Actions */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: 10,
            marginTop: 14,
          }}
        >
          {actions.map((a) => (
            <a
              key={a.key}
              href={a.href}
              target={a.targetBlank ? "_blank" : undefined}
              rel={a.targetBlank ? "noopener noreferrer" : undefined}
              style={{
                textDecoration: "none",
                border: "1px solid rgba(255,255,255,.10)",
                borderRadius: 14,
                padding: "12px 14px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                color: "inherit",
              }}
            >
              <span style={{ opacity: 0.9, whiteSpace: "nowrap" }}>{a.label}</span>
              <span
                style={{
                  opacity: 0.75,
                  fontSize: 13,
                  maxWidth: "62%",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  textAlign: "right",
                }}
                title={a.value}
              >
                {a.value}
              </span>
            </a>
          ))}
        </div>

        {/* vCard */}
        <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
          <button
            onClick={downloadVCF}
            style={{
              padding: 12,
              borderRadius: 14,
              border: "1px solid rgba(255,255,255,.10)",
              background: "rgba(255,255,255,.06)",
              cursor: "pointer",
              color: "inherit",
            }}
          >
            📇 บันทึกลง Contacts (vCard)
          </button>
        </div>

        {/* QR */}
        <div style={{ marginTop: 16, display: "grid", placeItems: "center" }}>
          <div style={{ fontSize: 13, opacity: 0.75, marginBottom: 8 }}>QR Code</div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {qr ? (
            <img src={qr} alt="QR" style={{ width: 220, height: 220 }} />
          ) : (
            <div
              style={{
                width: 220,
                height: 220,
                display: "grid",
                placeItems: "center",
                opacity: 0.6,
              }}
            >
              กำลังสร้าง QR...
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
