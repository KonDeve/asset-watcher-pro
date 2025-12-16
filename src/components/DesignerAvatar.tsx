import { Designer } from "@/types/asset";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface DesignerAvatarProps {
  designer: Designer | null;
  size?: "sm" | "md";
  showName?: boolean;
}

export function DesignerAvatar({ designer, size = "sm", showName = false }: DesignerAvatarProps) {
  if (!designer) {
    return (
      <span className="text-xs text-muted-foreground italic">Unassigned</span>
    );
  }

  const sizeClasses = size === "sm" ? "w-6 h-6 text-xs" : "w-8 h-8 text-sm";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "rounded-full bg-primary/10 text-primary flex items-center justify-center font-medium",
              sizeClasses
            )}
          >
            {designer.avatar}
          </div>
          {showName && (
            <span className="text-sm">{designer.name}</span>
          )}
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <p className="font-medium">{designer.name}</p>
        <p className="text-xs text-muted-foreground">{designer.email}</p>
      </TooltipContent>
    </Tooltip>
  );
}
