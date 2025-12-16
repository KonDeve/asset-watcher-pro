import { MissingAsset, AssetStatus, statusConfig } from "@/types/asset";
import { designers } from "@/data/mockData";
import { StatusBadge } from "@/components/StatusBadge";
import { DesignerAvatar } from "@/components/DesignerAvatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X, Copy, Share2, Calendar, Clock, FileText, CheckCircle2, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AssetDetailsPanelProps {
  asset: MissingAsset;
  onClose: () => void;
  onStatusChange: (assetId: string, status: AssetStatus) => void;
  onDesignerChange: (assetId: string, designerId: string) => void;
  onBrandReflectionToggle?: (assetId: string, brandId: string, reflected: boolean) => void;
}

export function AssetDetailsPanel({
  asset,
  onClose,
  onStatusChange,
  onDesignerChange,
  onBrandReflectionToggle,
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
    <div className="w-80 lg:w-96 border-l border-border bg-card flex flex-col animate-slide-in-right shrink-0">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between shrink-0">
        <h2 className="font-semibold text-foreground">Asset Details</h2>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4 space-y-5">
        {/* Title */}
        <div className="bg-muted/50 rounded-lg p-3">
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

        {/* Brand Verification */}
        <div>
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3 block">
            Brand Verification
          </label>
          <div className="space-y-2">
            {asset.brands.map((brand) => (
              <div
                key={brand.id}
                className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30 border border-border"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: brand.color }}
                  />
                  <span className="text-sm font-medium text-foreground truncate">
                    {brand.name}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {brand.reflected ? (
                    <CheckCircle2 className="w-4 h-4 text-success" />
                  ) : (
                    <XCircle className="w-4 h-4 text-muted-foreground" />
                  )}
                  <Switch
                    checked={brand.reflected}
                    onCheckedChange={(checked) =>
                      onBrandReflectionToggle?.(asset.id, brand.id, checked)
                    }
                    className="data-[state=checked]:bg-success"
                  />
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Toggle to verify if the asset is reflected on each brand's website.
          </p>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-muted/30 rounded-lg p-3">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1 block">
              Date Found
            </label>
            <div className="flex items-center gap-2 text-sm text-foreground">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              {new Date(asset.dateFound).toLocaleDateString()}
            </div>
          </div>
          <div className="bg-muted/30 rounded-lg p-3">
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
      <div className="p-4 border-t border-border flex gap-2 shrink-0">
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