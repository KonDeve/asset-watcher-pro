import { AssetStatus, statusConfig } from "@/types/asset";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: AssetStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <span className={cn("status-chip", config.className, className)}>
      {config.label}
    </span>
  );
}
