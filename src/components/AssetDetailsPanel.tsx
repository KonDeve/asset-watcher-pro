import { useEffect, useState } from "react";
import { MissingAsset, AssetStatus, statusConfig } from "@/types/asset";
import { StatusBadge } from "@/components/StatusBadge";
import { DesignerAvatar } from "@/components/DesignerAvatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
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
import { Calendar, Clock, FileText, CheckCircle2, XCircle, User, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useDesigners } from "@/hooks/useData";

interface AssetDetailsPanelProps {
  asset: MissingAsset;
  onClose: () => void;
  onStatusChange: (assetId: string, status: AssetStatus) => void;
  onGameNameChange: (assetId: string, gameName: string) => Promise<boolean> | boolean;
  onNotesChange: (assetId: string, notes: string) => Promise<boolean> | boolean;
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
  onGameNameChange,
  onNotesChange,
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
  const [gameNameSaving, setGameNameSaving] = useState(false);
  const [gameNameInput, setGameNameInput] = useState(asset.gameName);
  const [notesSaving, setNotesSaving] = useState(false);
  const [notesInput, setNotesInput] = useState(asset.notes || "");

  useEffect(() => {
    setSelectedBrandIds(asset.brands.map((b) => b.id));
    setGameNameInput(asset.gameName);
    setNotesInput(asset.notes || "");
  }, [asset.id, asset.brands, asset.gameName, asset.notes]);

  const handleGameNameSave = async () => {
    const trimmed = gameNameInput.trim();
    if (trimmed.length === 0 || trimmed === asset.gameName) return;
    setGameNameSaving(true);
    const success = await onGameNameChange(asset.id, trimmed);
    if (success) {
      toast({ title: "Game name updated", description: trimmed });
    } else {
      setGameNameInput(asset.gameName);
      toast({ title: "Update failed", description: "Could not update game name.", variant: "destructive" });
    }
    setGameNameSaving(false);
  };

  const handleNotesSave = async () => {
    const trimmed = notesInput.trim();
    if (trimmed === asset.notes) return;
    setNotesSaving(true);
    const success = await onNotesChange(asset.id, trimmed);
    if (success) {
      toast({ title: "Notes updated" });
    } else {
      setNotesInput(asset.notes || "");
      toast({ title: "Update failed", description: "Could not update notes.", variant: "destructive" });
    }
    setNotesSaving(false);
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
            <div className="bg-muted/50 rounded-lg p-3 space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block">
                Game Name
              </label>
              <div className="flex gap-2">
                <Input
                  value={gameNameInput}
                  onChange={(e) => setGameNameInput(e.target.value)}
                  placeholder="Edit game name"
                  className="bg-card"
                />
                <Button
                  onClick={handleGameNameSave}
                  disabled={gameNameSaving || gameNameInput.trim().length === 0 || gameNameInput.trim() === asset.gameName}
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save
                </Button>
              </div>
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
              value={notesInput}
              onChange={(e) => setNotesInput(e.target.value)}
              placeholder="Add notes..."
              className="min-h-24 text-sm resize-none"
            />
            <div className="mt-2 flex justify-end">
              <Button
                size="sm"
                onClick={handleNotesSave}
                disabled={notesSaving || notesInput.trim() === (asset.notes || "")}
              >
                <Save className="w-4 h-4 mr-2" />
                Save Notes
              </Button>
            </div>
          </div>
        </div>

        {/* Footer spacer removed as copy/share not needed */}
      </DialogContent>
    </Dialog>
  );
}