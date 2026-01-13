"use client";

import ContactForm from "@/app/_components/ContactForm";

export default function AdminNewPage() {
  return (
    <main className="min-h-screen p-6">
      <div className="mx-auto max-w-2xl">
        <ContactForm mode="create" />
      </div>
    </main>
  );
}

