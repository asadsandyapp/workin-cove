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
        <CardTitle>New workspace</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={upsertWorkspace} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="code">Code</Label>
            <Input id="code" name="code" placeholder="HQ" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" rows={3} />
          </div>
          <Button type="submit" className="w-full">
            Create workspace
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
