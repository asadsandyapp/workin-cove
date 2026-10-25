import { createProperty } from "@/app/actions/operations";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export default function NewPropertyPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Add property" description="Company-owned inventory record." />
      <form action={createProperty} className="space-y-4 rounded-lg border bg-white p-6">
        <div className="space-y-1.5">
          <Label>Name</Label>
          <Input name="name" required />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Code</Label>
            <Input name="code" />
          </div>
          <div className="space-y-1.5">
            <Label>Type</Label>
            <Select name="propertyType" defaultValue="COMMERCIAL">
              {["COMMERCIAL", "RESIDENTIAL", "MIXED", "LAND", "OTHER"].map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Address</Label>
          <Input name="addressLine1" required />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input name="city" placeholder="City" />
          <Input name="area" placeholder="Area" />
          <Input name="sizeSqFt" type="number" placeholder="Size sq ft" />
          <Input name="acquisitionCost" type="number" step="0.01" placeholder="Acquisition cost" />
          <Input name="acquisitionDate" type="date" />
          <Select name="status" defaultValue="AVAILABLE">
            {["AVAILABLE", "OCCUPIED", "OWNED", "UNDER_MAINTENANCE", "SOLD"].map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </div>
        <Textarea name="notes" rows={3} />
        <Button type="submit">Save property</Button>
      </form>
    </div>
  );
}
