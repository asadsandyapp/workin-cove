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
    <form action={createLease} className="space-y-6 rounded-lg border border-slate-200 bg-white p-6">
      <input type="hidden" name="tenantMode" value={mode} />

      <section className="space-y-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">1. Property</h2>
          <p className="text-xs text-slate-500">Which unit is being rented?</p>
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

      <section className="space-y-3 border-t border-slate-100 pt-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">2. Tenant</h2>
            <p className="text-xs text-slate-500">
              Enter the person once — we create the CRM contact and tenant for you.
            </p>
          </div>
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
              disabled={!tenants.length}
            >
              Existing tenant
            </button>
          </div>
        </div>

        {mode === "new" ? (
          <div className="grid gap-3 sm:grid-cols-2">
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
            <Select id="tenantId" name="tenantId" required={mode === "existing"} defaultValue="">
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

      <section className="space-y-3 border-t border-slate-100 pt-5">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">3. Lease terms</h2>
          <p className="text-xs text-slate-500">Rent amount and dates.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
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
            <Input id="dueDayOfMonth" name="dueDayOfMonth" type="number" defaultValue={1} min={1} max={28} />
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

      <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 pt-5">
        <Button type="submit">Create lease</Button>
        <p className="text-xs text-slate-500">
          Saves contact + tenant + lease in one step. Then you can generate the first rent invoice.
        </p>
      </div>
    </form>
  );
}
