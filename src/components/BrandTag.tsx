import { Brand } from "@/types/asset";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Check, X } from "lucide-react";

interface BrandTagProps {
  brand: Brand;
  showReflection?: boolean;
}

export function BrandTag({ brand, showReflection = true }: BrandTagProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={cn(
            "inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium",
            "bg-muted text-foreground border border-border"
          )}
          style={{
            borderLeftColor: brand.color,
            borderLeftWidth: "3px",
          }}
        >
          {brand.name}
          {showReflection && (
            brand.reflected ? (
              <Check className="w-3 h-3 text-success" />
            ) : (
              <X className="w-3 h-3 text-muted-foreground" />
            )
          )}
        </span>
      </TooltipTrigger>
      <TooltipContent>
        <div className="text-xs">
          <p className="font-medium">{brand.name}</p>
          {brand.reflected ? (
            <>
              <p className="text-success">✓ Reflected</p>
              {brand.reflectedBy && (
                <p className="text-muted-foreground">by {brand.reflectedBy} on {brand.reflectedAt}</p>
              )}
            </>
          ) : (
            <p className="text-muted-foreground">Not reflected</p>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
