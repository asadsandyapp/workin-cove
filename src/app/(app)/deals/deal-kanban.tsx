"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatMoney } from "@/lib/utils";

type Stage = { id: string; name: string; color: string; isLost: boolean };
type Deal = {
  id: string;
  title: string;
  value: number;
  currency: string;
  stageId: string;
  nextAction: string | null;
  companyName: string | null;
};

export function DealKanban({
  stages,
  deals,
}: {
  stages: Stage[];
  deals: Deal[];
}) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function move(dealId: string, stageId: string, isLost: boolean) {
    let lossReason: string | null = null;
    if (isLost) {
      lossReason = window.prompt("Loss reason?") || "Not specified";
    }
    setPendingId(dealId);
    const form = new FormData();
    form.set("dealId", dealId);
    form.set("stageId", stageId);
    if (lossReason) form.set("lossReason", lossReason);
    await fetch("/api/deals/move-stage", { method: "POST", body: form });
    setPendingId(null);
    router.refresh();
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-4">
      {stages.map((stage) => {
        const column = deals.filter((d) => d.stageId === stage.id);
        return (
          <div
            key={stage.id}
            className="w-72 shrink-0 rounded-lg border border-stone-200 bg-white/80"
          >
            <div className="flex items-center justify-between border-b px-3 py-2">
              <div className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: stage.color }}
                />
                <p className="text-sm font-medium">{stage.name}</p>
              </div>
              <span className="text-xs text-stone-500">{column.length}</span>
            </div>
            <div className="space-y-2 p-2">
              {column.map((deal) => (
                <div
                  key={deal.id}
                  className="rounded-md border border-stone-100 bg-white p-3 shadow-sm"
                >
                  <Link
                    href={`/deals/${deal.id}`}
                    className="text-sm font-medium text-teal-950 hover:underline"
                  >
                    {deal.title}
                  </Link>
                  <p className="mt-1 text-xs text-stone-500">
                    {formatMoney(deal.value, deal.currency)}
                    {deal.companyName ? ` · ${deal.companyName}` : ""}
                  </p>
                  {deal.nextAction ? (
                    <p className="mt-1 text-xs text-stone-600">{deal.nextAction}</p>
                  ) : null}
                  <select
                    className="mt-2 w-full rounded border px-2 py-1 text-xs"
                    value={deal.stageId}
                    disabled={pendingId === deal.id}
                    onChange={(e) => {
                      const next = stages.find((s) => s.id === e.target.value);
                      if (next) move(deal.id, next.id, next.isLost);
                    }}
                  >
                    {stages.map((s) => (
                      <option key={s.id} value={s.id}>
                        Move to {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
