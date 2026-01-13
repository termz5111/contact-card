"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

type Contact = {
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
  photo_url?: string;
};

const normUrl = (v?: string) => {
  const s = (v || "").trim();
  if (!s) return "";
  if (/^https?:\/\//i.test(s)) return s;
  return `https://${s}`;
};
const normTel = (v?: string) => (v || "").trim().replace(/[^0-9+]/g, "");
const normLine = (v?: string) => {
  const s = (v || "").trim().replace(/^@+/, "");
  if (!s) return "";
  if (/^https?:\/\//i.test(s) || /^line:\/\//i.test(s)) return s;
  return `https://line.me/R/ti/p/~${s}`;
};
const normFb = (v?: string) => {
  const s = (v || "").trim();
  if (!s) return "";
  if (/^https?:\/\//i.test(s)) return s;
  return `https://facebook.com/${s.replace(/^@+/, "")}`;
};
const normIg = (v?: string) => {
  const s = (v || "").trim();
  if (!s) return "";
  if (/^https?:\/\//i.test(s)) return s;
  return `https://instagram.com/${s.replace(/^@+/, "")}`;
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
  lines.push(`FN:${vcfEscape(c.full_name)}`);
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

  const subtitle = [contact.position, contact.company].filter(Boolean).join(" • ") || "—";

  const actions = [
    { label: "📞 โทร", href: contact.phone ? `tel:${normTel(contact.phone)}` : "" },
    { label: "✉️ Email", href: contact.email ? `mailto:${contact.email.trim()}` : "" },
    { label: "🌐 Website", href: contact.website ? normUrl(contact.website) : "" },
    { label: "💬 Line", href: contact.line_id ? normLine(contact.line_id) : "" },
    { label: "📘 Facebook", href: contact.facebook ? normFb(contact.facebook) : "" },
    { label: "📷 Instagram", href: contact.instagram ? normIg(contact.instagram) : "" },
  ].filter(a => a.href);

  const downloadVCF = () => {
    const vcf = buildVCard(contact);
    const blob = new Blob([vcf], { type: "text/vcard;charset=utf-8" });
    const objUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = objUrl;
    a.download = `${contact.full_name.replace(/\s+/g, "_")}.vcf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(objUrl);
  };

  return (
    <main style={{ padding: 16, maxWidth: 760, margin: "0 auto" }}>
      <section style={{ border: "1px solid rgba(0,0,0,.12)", borderRadius: 18, padding: 16 }}>
        <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
          <div style={{
            width: 76, height: 76, borderRadius: 18, overflow: "hidden",
            background: "rgba(0,0,0,.06)", display: "grid", placeItems: "center"
          }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {contact.photo_url ? <img src={contact.photo_url} alt={contact.full_name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: 30 }}>👤</span>}
          </div>
          <div style={{ flex: 1 }}>
            <h1 style={{ margin: 0, fontSize: 22 }}>{contact.full_name}</h1>
            <p style={{ margin: "6px 0 0", opacity: .75 }}>{subtitle}</p>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10, marginTop: 14 }}>
          {actions.map(a => (
            <a key={a.label} href={a.href} target="_blank" rel="noopener"
              style={{ textDecoration: "none", border: "1px solid rgba(0,0,0,.12)", borderRadius: 14, padding: 12, textAlign: "center" }}>
              {a.label}
            </a>
          ))}
        </div>

        <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
          <button onClick={downloadVCF} style={{ padding: 12, borderRadius: 14, border: "none", cursor: "pointer" }}>
            📇 บันทึกลง Contacts (vCard)
          </button>
        </div>

        <div style={{ marginTop: 16, display: "grid", placeItems: "center" }}>
          <div style={{ fontSize: 13, opacity: .75, marginBottom: 8 }}>QR Code</div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {qr ? <img src={qr} alt="QR" style={{ width: 210, height: 210 }} /> : <div style={{ width: 210, height: 210, display: "grid", placeItems: "center", opacity: .6 }}>กำลังสร้าง QR...</div>}
        </div>
      </section>
    </main>
  );
}

