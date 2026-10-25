"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

const FIELDS = [
  { key: "firstName", label: "First name", required: true },
  { key: "lastName", label: "Last name", required: false },
  { key: "email", label: "Email", required: false },
  { key: "phone", label: "Phone", required: false },
  { key: "companyName", label: "Company", required: false },
  { key: "title", label: "Title", required: false },
  { key: "source", label: "Source", required: false },
  { key: "campaign", label: "Campaign", required: false },
  { key: "status", label: "Status", required: false },
  { key: "notes", label: "Notes", required: false },
];

type PreviewRow = {
  rowIndex: number;
  data: Record<string, string>;
  errors: string[];
  duplicate: boolean;
  duplicateReason?: string;
};

export function LeadImportClient({
  workspaces,
  recentJobs,
}: {
  workspaces: { id: string; name: string }[];
  recentJobs: {
    id: string;
    filename: string;
    status: string;
    totalRows: number;
    successCount: number;
    errorCount: number;
    duplicateCount: number;
    createdAt: string;
  }[];
}) {
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [preview, setPreview] = useState<PreviewRow[]>([]);
  const [fileToken, setFileToken] = useState("");
  const [workspaceId, setWorkspaceId] = useState("");
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [summary, setSummary] = useState<Record<string, number> | null>(null);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  const invalidCount = useMemo(
    () => preview.filter((r) => r.errors.length).length,
    [preview],
  );
  const dupCount = useMemo(
    () => preview.filter((r) => r.duplicate).length,
    [preview],
  );

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPending(true);
    setError("");
    setSummary(null);
    const form = new FormData();
    form.set("file", file);
    form.set("mode", "parse");
    const res = await fetch("/api/leads/import", { method: "POST", body: form });
    const data = await res.json();
    setPending(false);
    if (!res.ok) {
      setError(data.error || "Parse failed");
      return;
    }
    setHeaders(data.headers);
    setMapping(data.suggestedMapping);
    setFileToken(data.fileToken);
    setPreview([]);
  }

  async function runPreview() {
    setPending(true);
    setError("");
    const res = await fetch("/api/leads/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "preview", fileToken, mapping }),
    });
    const data = await res.json();
    setPending(false);
    if (!res.ok) {
      setError(data.error || "Preview failed");
      return;
    }
    setPreview(data.rows);
  }

  async function commit() {
    setPending(true);
    setError("");
    const res = await fetch("/api/leads/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: "commit",
        fileToken,
        mapping,
        workspaceId: workspaceId || null,
        skipDuplicates,
      }),
    });
    const data = await res.json();
    setPending(false);
    if (!res.ok) {
      setError(data.error || "Import failed");
      return;
    }
    setSummary({
      successCount: data.successCount,
      errorCount: data.errorCount,
      duplicateCount: data.duplicateCount,
    });
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>1. Upload file</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <input type="file" accept=".csv,.xlsx,.xls,.txt" onChange={onFile} />
          <p className="text-xs text-stone-500">
            Sample headers: First name, Last name, Email, Phone, Company, Source, Campaign
          </p>
          <a
            href="/api/leads/import?sample=1"
            className="text-sm text-teal-800 underline"
          >
            Download sample CSV
          </a>
        </CardContent>
      </Card>

      {headers.length ? (
        <Card>
          <CardHeader>
            <CardTitle>2. Map fields</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {FIELDS.map((field) => (
              <div key={field.key} className="space-y-1.5">
                <Label>
                  {field.label}
                  {field.required ? " *" : ""}
                </Label>
                <Select
                  value={mapping[field.key] || ""}
                  onChange={(e) =>
                    setMapping((m) => ({ ...m, [field.key]: e.target.value }))
                  }
                >
                  <option value="">— skip —</option>
                  {headers.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </Select>
              </div>
            ))}
            <div className="space-y-1.5">
              <Label>Team (optional)</Label>
              <Select
                value={workspaceId}
                onChange={(e) => setWorkspaceId(e.target.value)}
              >
                <option value="">None</option>
                {workspaces.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex items-end">
              <Button type="button" onClick={runPreview} disabled={pending}>
                Preview import
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {preview.length ? (
        <Card>
          <CardHeader>
            <CardTitle>3. Preview & commit</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2 text-sm">
              <Badge variant="secondary">{preview.length} rows</Badge>
              <Badge variant="warning">{invalidCount} invalid</Badge>
              <Badge variant="outline">{dupCount} duplicates</Badge>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={skipDuplicates}
                onChange={(e) => setSkipDuplicates(e.target.checked)}
              />
              Skip duplicates
            </label>
            <div className="max-h-80 overflow-auto rounded-md border">
              <table className="min-w-full text-xs">
                <thead className="bg-stone-50">
                  <tr>
                    <th className="px-2 py-2 text-left">Row</th>
                    <th className="px-2 py-2 text-left">Name</th>
                    <th className="px-2 py-2 text-left">Email</th>
                    <th className="px-2 py-2 text-left">Issues</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.slice(0, 50).map((row) => (
                    <tr key={row.rowIndex} className="border-t">
                      <td className="px-2 py-2">{row.rowIndex}</td>
                      <td className="px-2 py-2">
                        {row.data.firstName} {row.data.lastName}
                      </td>
                      <td className="px-2 py-2">{row.data.email}</td>
                      <td className="px-2 py-2 text-red-700">
                        {[...row.errors, row.duplicateReason].filter(Boolean).join("; ")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Button type="button" onClick={commit} disabled={pending}>
              Commit import
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {summary ? (
        <Card>
          <CardHeader>
            <CardTitle>Import summary</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            Created {summary.successCount}, errors {summary.errorCount}, duplicates{" "}
            {summary.duplicateCount}.
          </CardContent>
        </Card>
      ) : null}

      {error ? <p className="text-sm text-red-700">{error}</p> : null}

      <Card>
        <CardHeader>
          <CardTitle>Recent import jobs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {recentJobs.map((job) => (
            <div key={job.id} className="flex justify-between border-b py-2">
              <span>
                {job.filename} · {job.status}
              </span>
              <span className="text-stone-500">
                {job.successCount}/{job.totalRows} ok · {job.errorCount} err ·{" "}
                {job.duplicateCount} dup
              </span>
            </div>
          ))}
          {!recentJobs.length ? (
            <p className="text-stone-500">No imports yet.</p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
