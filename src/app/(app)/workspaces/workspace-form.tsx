import { upsertWorkspace } from "@/app/actions/crm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function WorkspaceForm() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Add a team</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-4 text-xs text-slate-500">
          Only if you split CRM work across desks. Example names: Sales, Client
          Services, Partnerships — not building names.
        </p>
        <form action={upsertWorkspace} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="name">Team name</Label>
            <Input id="name" name="name" required placeholder="e.g. Sales desk" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="code">Short code (optional)</Label>
            <Input id="code" name="code" placeholder="SALES" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="description">What this desk handles</Label>
            <Textarea
              id="description"
              name="description"
              rows={3}
              placeholder="e.g. Inbound rental inquiries from Meta ads"
            />
          </div>
          <Button type="submit" className="w-full">
            Create team
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
