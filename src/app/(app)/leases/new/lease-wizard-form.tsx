"use client";

import { useState } from "react";
import { createLease } from "@/app/actions/operations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type PropertyOption = { id: string; name: string };
type TenantOption = {
  id: string;
  label: string;
};

export function LeaseWizardForm({
  properties,
  tenants,
}: {
  properties: PropertyOption[];
  tenants: TenantOption[];
}) {
  const [mode, setMode] = useState<"new" | "existing">("new");

  return (
    <form action={createLease} className="form-panel animate-fade-up">
      <input type="hidden" name="tenantMode" value={mode} />

      <section className="form-section">
        <div>
          <h2 className="form-section-title">1. Property</h2>
          <p className="form-section-help">Which unit is being rented?</p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="propertyId">Property</Label>
          <Select id="propertyId" name="propertyId" required defaultValue="">
            <option value="" disabled>
              Select property
            </option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        </div>
      </section>

      <section className="form-section">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="form-section-title">2. Tenant</h2>
            <p className="form-section-help">
              Enter the person once — we create the CRM contact and tenant for you.
            </p>
          </div>
          <div className="flex rounded-lg border border-[var(--line)] bg-[var(--surface-muted)] p-1 text-xs font-medium">
            <button
              type="button"
              onClick={() => setMode("new")}
              className={`rounded-md px-3 py-1.5 transition ${
                mode === "new"
                  ? "bg-[var(--ink)] text-white"
                  : "text-[var(--ink-soft)] hover:text-[var(--ink)]"
              }`}
            >
              New person
            </button>
            <button
              type="button"
              onClick={() => setMode("existing")}
              className={`rounded-md px-3 py-1.5 transition ${
                mode === "existing"
                  ? "bg-[var(--ink)] text-white"
                  : "text-[var(--ink-soft)] hover:text-[var(--ink)]"
              }`}
              disabled={!tenants.length}
            >
              Existing tenant
            </button>
          </div>
        </div>

        {mode === "new" ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="firstName">First name</Label>
              <Input id="firstName" name="firstName" required={mode === "new"} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lastName">Last name</Label>
              <Input id="lastName" name="lastName" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" name="phone" />
            </div>
          </div>
        ) : (
          <div className="space-y-1.5">
            <Label htmlFor="tenantId">Existing tenant</Label>
            <Select
              id="tenantId"
              name="tenantId"
              required={mode === "existing"}
              defaultValue=""
            >
              <option value="" disabled>
                Select tenant
              </option>
              {tenants.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </Select>
          </div>
        )}
      </section>

      <section className="form-section">
        <div>
          <h2 className="form-section-title">3. Lease terms</h2>
          <p className="form-section-help">Rent amount and dates.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="startDate">Start date</Label>
            <Input id="startDate" name="startDate" type="date" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="endDate">End date (optional)</Label>
            <Input id="endDate" name="endDate" type="date" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="rentAmount">Monthly rent</Label>
            <Input
              id="rentAmount"
              name="rentAmount"
              type="number"
              step="0.01"
              min="0"
              required
              placeholder="e.g. 250000"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="dueDayOfMonth">Rent due day of month</Label>
            <Input
              id="dueDayOfMonth"
              name="dueDayOfMonth"
              type="number"
              defaultValue={1}
              min={1}
              max={28}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="securityDeposit">Security deposit</Label>
            <Input
              id="securityDeposit"
              name="securityDeposit"
              type="number"
              step="0.01"
              defaultValue={0}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="escalationPercent">Annual increase %</Label>
            <Input
              id="escalationPercent"
              name="escalationPercent"
              type="number"
              step="0.01"
              defaultValue={5}
            />
          </div>
        </div>
        <input type="hidden" name="status" value="ACTIVE" />
        <div className="space-y-1.5">
          <Label htmlFor="notes">Notes (optional)</Label>
          <Textarea id="notes" name="notes" rows={2} />
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-3 border-t border-[var(--line-soft)] pt-6">
        <Button type="submit" size="lg">
          Create lease
        </Button>
        <p className="text-sm text-[var(--ink-soft)]">
          Saves contact + tenant + lease in one step. Then generate the first rent invoice.
        </p>
      </div>
    </form>
  );
}
