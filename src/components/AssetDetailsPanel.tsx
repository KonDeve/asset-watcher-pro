import { useEffect, useState } from "react";
import { MissingAsset, AssetStatus, statusConfig } from "@/types/asset";
import { StatusBadge } from "@/components/StatusBadge";
import { DesignerAvatar } from "@/components/DesignerAvatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Copy, Share2, Calendar, Clock, FileText, CheckCircle2, XCircle, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useDesigners } from "@/hooks/useData";

interface AssetDetailsPanelProps {
  asset: MissingAsset;
  onClose: () => void;
  onStatusChange: (assetId: string, status: AssetStatus) => void;
  onDesignerChange: (assetId: string, designerId: string) => void;
  onBrandReflectionToggle?: (assetId: string, brandId: string, reflected: boolean) => void;
  onProviderChange: (assetId: string, provider: string) => Promise<boolean> | boolean;
  onBrandsChange: (assetId: string, brandIds: string[]) => Promise<boolean> | boolean;
  providerOptions: string[];
  brandOptions: { id: string; name: string; color: string }[];
}

export function AssetDetailsPanel({
  asset,
  onClose,
  onStatusChange,
  onDesignerChange,
  onBrandReflectionToggle,
  onProviderChange,
  onBrandsChange,
  providerOptions,
  brandOptions,
}: AssetDetailsPanelProps) {
  const { toast } = useToast();
  const { designers } = useDesigners();

  const [selectedBrandIds, setSelectedBrandIds] = useState<string[]>(asset.brands.map((b) => b.id));
  const [providerSaving, setProviderSaving] = useState(false);
  const [brandsSaving, setBrandsSaving] = useState(false);

  useEffect(() => {
    setSelectedBrandIds(asset.brands.map((b) => b.id));
  }, [asset.id, asset.brands]);

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

  const handleProviderSelect = async (providerName: string) => {
    if (providerName === asset.provider) return;
    setProviderSaving(true);
    const success = await onProviderChange(asset.id, providerName);
    if (success) {
      toast({ title: "Provider updated", description: `${asset.gameName} now uses ${providerName}.` });
    } else {
      toast({ title: "Update failed", description: "Could not update provider.", variant: "destructive" });
    }
    setProviderSaving(false);
  };

  const handleBrandToggle = async (brandId: string) => {
    const previous = selectedBrandIds;
    const next = previous.includes(brandId)
      ? previous.filter((id) => id !== brandId)
      : [...previous, brandId];

    setSelectedBrandIds(next);
    setBrandsSaving(true);
    const success = await onBrandsChange(asset.id, next);
    if (!success) {
      setSelectedBrandIds(previous);
      toast({ title: "Update failed", description: "Could not update brands.", variant: "destructive" });
    }
    setBrandsSaving(false);
  };

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Asset Details</DialogTitle>
        </DialogHeader>

        {/* Content */}
        <div className="flex-1 overflow-auto space-y-5 pr-2 scrollbar-thin">
          {/* Title */}
          <div className="bg-muted/50 rounded-lg p-3">
            <h3 className="text-lg font-semibold text-foreground mb-1">
              {asset.gameName}
            </h3>
            <p className="text-sm text-muted-foreground">{asset.provider}</p>
          </div>

          {/* Provider */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1 block">
              Provider
            </label>
            <Select
              value={asset.provider}
              onValueChange={handleProviderSelect}
              disabled={providerSaving}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select provider" />
              </SelectTrigger>
              <SelectContent>
                {providerOptions.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Brands */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Brands / Websites
              </label>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {brandOptions.map((brand) => (
                <div key={brand.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`brand-${brand.id}`}
                    checked={selectedBrandIds.includes(brand.id)}
                    onCheckedChange={() => handleBrandToggle(brand.id)}
                    disabled={brandsSaving}
                  />
                  <label
                    htmlFor={`brand-${brand.id}`}
                    className="text-sm font-medium leading-none cursor-pointer flex items-center gap-2"
                  >
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: brand.color }}
                    />
                    {brand.name}
                  </label>
                </div>
              ))}
              {brandOptions.length === 0 && (
                <p className="text-sm text-muted-foreground col-span-full">No brands available</p>
              )}
            </div>
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
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-muted/30 rounded-lg p-3">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1 block">
              Found By
            </label>
            <div className="flex items-center gap-2 text-sm text-foreground">
              <User className="w-4 h-4 text-muted-foreground" />
              {asset.foundBy}
            </div>
          </div>
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
        <div className="flex gap-2 pt-4 border-t border-border shrink-0">
          <Button variant="outline" size="sm" className="flex-1" onClick={handleCopyDoc}>
            <Copy className="w-4 h-4 mr-2" />
            Copy Doc
          </Button>
          <Button variant="outline" size="sm" className="flex-1">
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}