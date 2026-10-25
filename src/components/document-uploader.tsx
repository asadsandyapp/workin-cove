"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function DocumentUploader({
  entityType,
  entityId,
}: {
  entityType: "lead" | "contact" | "company" | "deal" | "property" | "expense" | "lease";
  entityId: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPending(true);
    setError("");
    const form = new FormData();
    form.set("file", file);
    form.set("entityType", entityType);
    form.set("entityId", entityId);
    const res = await fetch("/api/documents", { method: "POST", body: form });
    setPending(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Upload failed");
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-2">
      <Input type="file" onChange={onChange} disabled={pending} />
      {pending ? <p className="text-xs text-stone-500">Uploading…</p> : null}
      {error ? <p className="text-xs text-red-700">{error}</p> : null}
      <Button type="button" variant="outline" size="sm" disabled>
        Attach file above
      </Button>
    </div>
  );
}
