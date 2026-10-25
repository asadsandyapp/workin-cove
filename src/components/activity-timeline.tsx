import { Badge } from "@/components/ui/badge";

type ActivityItem = {
  id: string;
  type: string;
  summary: string;
  body?: string | null;
  createdAt: Date;
};

export function ActivityTimeline({ items }: { items: ActivityItem[] }) {
  if (!items.length) {
    return <p className="text-sm text-stone-500">No activity yet.</p>;
  }
  return (
    <ol className="space-y-4">
      {items.map((item) => (
        <li key={item.id} className="relative border-l border-stone-200 pl-4">
          <span className="absolute -left-1.5 top-1.5 h-3 w-3 rounded-full bg-teal-700" />
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{item.type}</Badge>
            <span className="text-xs text-stone-500">
              {item.createdAt.toLocaleString()}
            </span>
          </div>
          <p className="mt-1 text-sm text-stone-800">{item.summary}</p>
          {item.body ? (
            <p className="mt-1 text-sm text-stone-500">{item.body}</p>
          ) : null}
        </li>
      ))}
    </ol>
  );
}
