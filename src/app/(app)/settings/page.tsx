import {
  saveSettings,
  upsertCustomField,
  upsertTag,
  createPipeline,
  upsertPipelineStage,
} from "@/app/actions/crm";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const params = await searchParams;
  const tab = params.tab || "general";
  const [settings, fields, tags, pipelines] = await Promise.all([
    prisma.appSettings.findUnique({ where: { id: "default" } }),
    prisma.customFieldDefinition.findMany({ orderBy: [{ entityType: "asc" }, { sortOrder: "asc" }] }),
    prisma.tag.findMany({ orderBy: { name: "asc" } }),
    prisma.pipeline.findMany({
      include: { stages: { orderBy: { sortOrder: "asc" } } },
      orderBy: { name: "asc" },
    }),
  ]);

  const tabs = [
    { key: "general", label: "General" },
    { key: "integrations", label: "Integrations" },
    { key: "fields", label: "Custom fields" },
    { key: "tags", label: "Tags" },
    { key: "pipelines", label: "Pipelines" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Admin configuration for company, timezone, CRM customization, and lead webhooks."
      />
      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <a
            key={t.key}
            href={`/settings?tab=${t.key}`}
            className={`rounded-md px-3 py-1.5 text-sm ${
              tab === t.key ? "bg-teal-900 text-white" : "border bg-white"
            }`}
          >
            {t.label}
          </a>
        ))}
      </div>

      {tab === "general" || tab === "integrations" ? (
        <Card>
          <CardHeader>
            <CardTitle>
              {tab === "general" ? "Company & timezone" : "Lead integrations"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form action={saveSettings} className="space-y-4">
              {tab === "general" ? (
                <>
                  <div className="space-y-1.5">
                    <Label>Company name</Label>
                    <Input
                      name="companyName"
                      defaultValue={settings?.companyName || "Workin Cove"}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Business timezone</Label>
                    <Input
                      name="businessTimezone"
                      defaultValue={settings?.businessTimezone || "Asia/Karachi"}
                    />
                  </div>
                  <input type="hidden" name="metaVerifyToken" value={settings?.metaVerifyToken || ""} />
                  <input
                    type="hidden"
                    name="googleAdsSharedSecret"
                    value={settings?.googleAdsSharedSecret || ""}
                  />
                  {settings?.metaWebhookEnabled ? (
                    <input type="hidden" name="metaWebhookEnabled" value="on" />
                  ) : null}
                  {settings?.googleAdsWebhookEnabled ? (
                    <input type="hidden" name="googleAdsWebhookEnabled" value="on" />
                  ) : null}
                </>
              ) : (
                <>
                  <input type="hidden" name="companyName" value={settings?.companyName || ""} />
                  <input
                    type="hidden"
                    name="businessTimezone"
                    value={settings?.businessTimezone || ""}
                  />
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      name="metaWebhookEnabled"
                      defaultChecked={settings?.metaWebhookEnabled}
                    />
                    Enable Meta lead form webhook
                  </label>
                  <div className="space-y-1.5">
                    <Label>Meta verify token</Label>
                    <Input
                      name="metaVerifyToken"
                      defaultValue={settings?.metaVerifyToken || ""}
                    />
                  </div>
                  <p className="text-xs text-stone-500">
                    Endpoint: <code>/api/webhooks/meta</code> (GET verify + POST leads). Manual and
                    import continue when disabled.
                  </p>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      name="googleAdsWebhookEnabled"
                      defaultChecked={settings?.googleAdsWebhookEnabled}
                    />
                    Enable Google Ads lead form webhook
                  </label>
                  <div className="space-y-1.5">
                    <Label>Shared secret header (x-google-ads-secret)</Label>
                    <Input
                      name="googleAdsSharedSecret"
                      defaultValue={settings?.googleAdsSharedSecret || ""}
                    />
                  </div>
                  <p className="text-xs text-stone-500">
                    Endpoint: <code>/api/webhooks/google-ads</code>. Documented stub-compatible
                    payload with lead_id/email/phone. Not a claim of unsupported feed types.
                  </p>
                </>
              )}
              <Button type="submit">Save settings</Button>
            </form>
          </CardContent>
        </Card>
      ) : null}

      {tab === "fields" ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Definitions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {fields.map((f) => (
                <div key={f.id} className="flex justify-between border-b py-2">
                  <span>
                    {f.entityType}.{f.key} — {f.label}
                  </span>
                  <span className="text-stone-500">{f.fieldType}</span>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Add custom field</CardTitle>
            </CardHeader>
            <CardContent>
              <form action={upsertCustomField} className="space-y-3">
                <Select name="entityType" defaultValue="lead">
                  {["lead", "contact", "company", "deal"].map((e) => (
                    <option key={e} value={e}>
                      {e}
                    </option>
                  ))}
                </Select>
                <Input name="key" placeholder="key_snake_case" required />
                <Input name="label" placeholder="Label" required />
                <Select name="fieldType" defaultValue="text">
                  {["text", "number", "select", "date"].map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </Select>
                <Input name="optionsJson" placeholder='Options JSON e.g. ["A","B"]' />
                <Button type="submit">Save field</Button>
              </form>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {tab === "tags" ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Tags</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {tags.map((t) => (
                <div key={t.id} className="flex items-center gap-2 text-sm">
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: t.color }}
                  />
                  {t.name}
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Add tag</CardTitle>
            </CardHeader>
            <CardContent>
              <form action={upsertTag} className="space-y-3">
                <Input name="name" placeholder="Tag name" required />
                <Input name="color" type="color" defaultValue="#0f766e" />
                <Button type="submit">Save tag</Button>
              </form>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {tab === "pipelines" ? (
        <div className="space-y-6">
          {pipelines.map((p) => (
            <Card key={p.id}>
              <CardHeader>
                <CardTitle>
                  {p.name} {p.isDefault ? "(default)" : ""}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {p.stages.map((s) => (
                  <div key={s.id} className="flex justify-between text-sm">
                    <span>
                      {s.sortOrder}. {s.name}
                    </span>
                    <span className="text-stone-500">
                      {s.probability}%
                      {s.isWon ? " · WON" : ""}
                      {s.isLost ? " · LOST" : ""}
                    </span>
                  </div>
                ))}
                <form action={upsertPipelineStage} className="grid gap-2 border-t pt-3 sm:grid-cols-4">
                  <input type="hidden" name="pipelineId" value={p.id} />
                  <Input name="name" placeholder="Stage name" required />
                  <Input name="sortOrder" type="number" placeholder="Order" defaultValue={50} />
                  <Input name="probability" type="number" placeholder="Prob %" defaultValue={50} />
                  <Button type="submit">Add stage</Button>
                </form>
              </CardContent>
            </Card>
          ))}
          <Card>
            <CardHeader>
              <CardTitle>New pipeline</CardTitle>
            </CardHeader>
            <CardContent>
              <form action={createPipeline} className="space-y-3">
                <Input name="name" placeholder="Pipeline name" required />
                <Input name="description" placeholder="Description" />
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="isDefault" /> Make default
                </label>
                <Button type="submit">Create pipeline</Button>
              </form>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
