import { MissingAsset, AssetStatus, statusConfig } from "@/types/asset";
import { designers } from "@/data/mockData";
import { StatusBadge } from "@/components/StatusBadge";
import { DesignerAvatar } from "@/components/DesignerAvatar";
import { BrandTag } from "@/components/BrandTag";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X, Copy, Share2, Calendar, Clock, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AssetDetailsPanelProps {
  asset: MissingAsset;
  onClose: () => void;
  onStatusChange: (assetId: string, status: AssetStatus) => void;
  onDesignerChange: (assetId: string, designerId: string) => void;
}

export function AssetDetailsPanel({
  asset,
  onClose,
  onStatusChange,
  onDesignerChange,
}: AssetDetailsPanelProps) {
  const { toast } = useToast();

  const handleCopyDoc = () => {
    const text = `Game Name: ${asset.gameName}
Provider: ${asset.provider}
Brand: ${asset.brands.map((b) => b.name).join(", ")}
Status: ${statusConfig[asset.status].label}
Notes: ${asset.notes || "N/A"}`;

    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: "Asset details have been copied.",
    });
  };

  return (
    <div className="w-80 border-l border-border bg-card flex flex-col animate-slide-in-right">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h2 className="font-semibold text-foreground">Details</h2>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4 space-y-5">
        {/* Title */}
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-1">
            {asset.gameName}
          </h3>
          <p className="text-sm text-muted-foreground">{asset.provider}</p>
        </div>

        {/* Status */}
        <div>
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">
            Status
          </label>
          <Select
            value={asset.status}
            onValueChange={(v) => onStatusChange(asset.id, v as AssetStatus)}
          >
            <SelectTrigger className="w-full">
              <StatusBadge status={asset.status} />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(statusConfig).map(([key, config]) => (
                <SelectItem key={key} value={key}>
                  {config.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Designer */}
        <div>
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">
            Assigned Designer
          </label>
          <Select
            value={asset.designer?.id || "unassigned"}
            onValueChange={(v) => onDesignerChange(asset.id, v)}
          >
            <SelectTrigger className="w-full">
              <DesignerAvatar designer={asset.designer} showName />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unassigned">Unassigned</SelectItem>
              {designers.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {d.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Brands */}
        <div>
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">
            Brands / Websites
          </label>
          <div className="flex flex-wrap gap-2">
            {asset.brands.map((brand) => (
              <BrandTag key={brand.id} brand={brand} showReflection />
            ))}
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1 block">
              Date Found
            </label>
            <div className="flex items-center gap-2 text-sm text-foreground">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              {new Date(asset.dateFound).toLocaleDateString()}
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1 block">
              Last Updated
            </label>
            <div className="flex items-center gap-2 text-sm text-foreground">
              <Clock className="w-4 h-4 text-muted-foreground" />
              {new Date(asset.updatedAt).toLocaleDateString()}
            </div>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
            <FileText className="w-3.5 h-3.5" />
            Notes
          </label>
          <Textarea
            value={asset.notes}
            placeholder="Add notes..."
            className="min-h-24 text-sm resize-none"
            readOnly
          />
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-border flex gap-2">
        <Button variant="outline" size="sm" className="flex-1" onClick={handleCopyDoc}>
          <Copy className="w-4 h-4 mr-2" />
          Copy Doc
        </Button>
        <Button variant="outline" size="sm" className="flex-1">
          <Share2 className="w-4 h-4 mr-2" />
          Share
        </Button>
      </div>
    </div>
  );
}
