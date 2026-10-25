"use client";

import Link from "next/link";
import { useState } from "react";
import { createTenant } from "@/app/actions/operations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type ContactOption = { id: string; label: string };

export function TenantForm({ contacts }: { contacts: ContactOption[] }) {
  const [mode, setMode] = useState<"new" | "existing">("new");

  return (
    <div className="space-y-4">
      <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
        Tip: prefer{" "}
        <Link href="/leases/new" className="font-medium underline">
          New lease
        </Link>{" "}
        — one screen for property + person + rent.
      </div>

      <form action={createTenant} className="space-y-4 rounded-lg border border-slate-200 bg-white p-6">
        <input type="hidden" name="tenantMode" value={mode} />
        <div className="flex rounded-md border border-slate-200 p-0.5 text-xs">
          <button
            type="button"
            onClick={() => setMode("new")}
            className={`rounded px-3 py-1.5 ${
              mode === "new" ? "bg-slate-900 text-white" : "text-slate-600"
            }`}
          >
            New person
          </button>
          <button
            type="button"
            onClick={() => setMode("existing")}
            className={`rounded px-3 py-1.5 ${
              mode === "existing" ? "bg-slate-900 text-white" : "text-slate-600"
            }`}
            disabled={!contacts.length}
          >
            Existing contact
          </button>
        </div>

        {mode === "new" ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="firstName">First name</Label>
              <Input id="firstName" name="firstName" required={mode === "new"} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lastName">Last name</Label>
              <Input id="lastName" name="lastName" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" name="phone" />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" />
            </div>
          </div>
        ) : (
          <div className="space-y-1.5">
            <Label htmlFor="contactId">CRM contact</Label>
            <Select
              id="contactId"
              name="contactId"
              required={mode === "existing"}
              defaultValue=""
            >
              <option value="" disabled>
                Select contact
              </option>
              {contacts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </Select>
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="notes">Notes (optional)</Label>
          <Textarea id="notes" name="notes" rows={2} placeholder="Notes" />
        </div>
        <Button type="submit">Save tenant</Button>
      </form>
    </div>
  );
}
