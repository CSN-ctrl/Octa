import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  NODE_STATUS_LABELS,
  type NodeDisplayStatus,
} from "@/lib/node-approve-copy";
import { isNodeDisplayStatus } from "@/lib/node-approve-contract";

const STATUS_CLASS: Record<NodeDisplayStatus, string> = {
  pending: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
  approved: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
  rejected: "bg-destructive/15 text-destructive border-destructive/30",
  revoked: "bg-muted text-muted-foreground border-border",
  suspended: "bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-500/30",
};

export function NodeStatusBadge({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  const normalized: NodeDisplayStatus = isNodeDisplayStatus(status) ? status : "pending";
  return (
    <Badge
      variant="outline"
      className={cn(STATUS_CLASS[normalized], className)}
      aria-label={`${NODE_STATUS_LABELS[normalized]} status`}
    >
      {NODE_STATUS_LABELS[normalized]}
    </Badge>
  );
}
