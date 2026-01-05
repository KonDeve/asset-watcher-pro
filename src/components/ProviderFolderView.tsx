import { useEffect, useMemo, useRef, useState } from "react";
import { MissingAsset, AssetStatus, statusConfig, Designer } from "@/types/asset";
import { StatusBadge } from "@/components/StatusBadge";
import { DesignerAvatar } from "@/components/DesignerAvatar";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import {
  Folder,
  FolderOpen,
  Gamepad2,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  GripVertical,
  Trash2,
  Clipboard,
  Copy,
} from "lucide-react";

type ProviderFolderViewProps = {
  assets: MissingAsset[];
  designers: Designer[];
  onStatusChange: (assetId: string, status: AssetStatus) => void;
  onDesignerChange: (assetId: string, designerId: string) => void;
  onAssetClick: (asset: MissingAsset) => void;
  onDeleteRequest: (asset: MissingAsset) => void;
};

export function ProviderFolderView({
  assets,
  designers,
  onStatusChange,
  onDesignerChange,
  onAssetClick,
  onDeleteRequest,
}: ProviderFolderViewProps) {
  const [openProvider, setOpenProvider] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragType, setDragType] = useState<"status" | "designer" | null>(null);
  const [dragStartIndex, setDragStartIndex] = useState<number | null>(null);
  const [dragCurrentIndex, setDragCurrentIndex] = useState<number | null>(null);
  const [dragValue, setDragValue] = useState<AssetStatus | string | null>(null);
  const tableRef = useRef<HTMLTableElement>(null);
  const providerAssetsRef = useRef<MissingAsset[]>([]);

  const dragStateRef = useRef({
    isDragging: false,
    dragType: null as "status" | "designer" | null,
    startIndex: null as number | null,
    currentIndex: null as number | null,
    value: null as AssetStatus | string | null,
  });

  // Group assets by provider
  const providerGroups = assets.reduce((groups, asset) => {
    const provider = asset.provider;
    if (!groups[provider]) {
      groups[provider] = [];
    }
    groups[provider].push(asset);
    return groups;
  }, {} as Record<string, MissingAsset[]>);

  // Sort providers alphabetically
  const sortedProviders = Object.keys(providerGroups).sort((a, b) =>
    a.localeCompare(b)
  );

  // Get status summary for a provider
  const getStatusSummary = (providerAssets: MissingAsset[]) => {
    const summary: Record<AssetStatus, number> = {
      "not-started": 0,
      ongoing: 0,
      completed: 0,
      exported: 0,
      uploaded: 0,
    };
    providerAssets.forEach((asset) => {
      summary[asset.status]++;
    });
    return summary;
  };

  const providerAssets = useMemo(
    () => (openProvider ? providerGroups[openProvider] || [] : []),
    [openProvider, providerGroups]
  );

  const providerCopyText = useMemo(() => {
    if (!openProvider) return "";
    return providerAssets
      .map((asset) => asset.gameName.toLowerCase().replace(/\s+/g, ""))
      .join("\n");
  }, [openProvider, providerAssets]);

  const providerCopyTextNormal = useMemo(() => {
    if (!openProvider) return "";
    return providerAssets.map((asset) => asset.gameName).join("\n");
  }, [openProvider, providerAssets]);

  const { toast } = useToast();

  useEffect(() => {
    providerAssetsRef.current = providerAssets;
  }, [providerAssets]);

  const handleDragStart = (
    e: React.MouseEvent,
    index: number,
    type: "status" | "designer",
    value: AssetStatus | string
  ) => {
    if (!openProvider) return;
    e.preventDefault();
    e.stopPropagation();

    setIsDragging(true);
    setDragType(type);
    setDragStartIndex(index);
    setDragCurrentIndex(index);
    setDragValue(value);

    dragStateRef.current = {
      isDragging: true,
      dragType: type,
      startIndex: index,
      currentIndex: index,
      value,
    };

    document.addEventListener("mousemove", handleDragMove);
    document.addEventListener("mouseup", handleDragEnd);
  };

  const handleDragMove = (e: MouseEvent) => {
    if (!dragStateRef.current.isDragging || !tableRef.current) return;

    const rows = tableRef.current.querySelectorAll("tbody tr");
    let newIndex = dragStateRef.current.startIndex;

    rows.forEach((row, index) => {
      const rect = row.getBoundingClientRect();
      if (e.clientY >= rect.top && e.clientY <= rect.bottom) {
        newIndex = index;
      }
    });

    if (newIndex !== dragStateRef.current.currentIndex) {
      dragStateRef.current.currentIndex = newIndex;
      setDragCurrentIndex(newIndex);
    }
  };

  const handleDragEnd = () => {
    const { isDragging: dragging, startIndex, currentIndex, value, dragType: type } = dragStateRef.current;
    const activeAssets = providerAssetsRef.current;

    if (dragging && startIndex !== null && currentIndex !== null && value !== null && activeAssets.length) {
      const startIdx = Math.min(startIndex, currentIndex);
      const endIdx = Math.max(startIndex, currentIndex);

      if (startIdx !== endIdx) {
        const affectedAssets = activeAssets.slice(startIdx, endIdx + 1);

        if (type === "status") {
          affectedAssets.forEach((a) => onStatusChange(a.id, value as AssetStatus));
          toast({
            title: "Bulk status update",
            description: `Updated ${affectedAssets.length} assets to "${statusConfig[value as AssetStatus].label}"`,
          });
        } else if (type === "designer") {
          affectedAssets.forEach((a) => onDesignerChange(a.id, value as string));
          const designerName =
            value === "unassigned"
              ? "Unassigned"
              : designers.find((d) => d.id === value)?.name || "Designer";
          toast({
            title: "Bulk designer update",
            description: `Updated ${affectedAssets.length} assets to "${designerName}"`,
          });
        }
      }
    }

    dragStateRef.current = {
      isDragging: false,
      dragType: null,
      startIndex: null,
      currentIndex: null,
      value: null,
    };

    setIsDragging(false);
    setDragType(null);
    setDragStartIndex(null);
    setDragCurrentIndex(null);
    setDragValue(null);

    document.removeEventListener("mousemove", handleDragMove);
    document.removeEventListener("mouseup", handleDragEnd);
  };

  useEffect(() => {
    return () => {
      document.removeEventListener("mousemove", handleDragMove);
      document.removeEventListener("mouseup", handleDragEnd);
    };
  }, []);

  const isInDragRange = (index: number) => {
    if (!isDragging || dragStartIndex === null || dragCurrentIndex === null) return false;
    const start = Math.min(dragStartIndex, dragCurrentIndex);
    const end = Math.max(dragStartIndex, dragCurrentIndex);
    return index >= start && index <= end;
  };

  if (openProvider) {

    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex flex-col gap-3 p-4 border-b border-border bg-muted/30">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setOpenProvider(null)}
              className="h-8"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
            <div className="flex items-center gap-2">
              <FolderOpen className="w-5 h-5 text-primary" />
              <h2 className="font-semibold text-foreground">{openProvider}</h2>
              <span className="text-sm text-muted-foreground">
                ({providerAssets.length} game{providerAssets.length !== 1 ? "s" : ""})
              </span>
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <Button
                variant="secondary"
                size="sm"
                disabled={!providerAssets.length}
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(providerCopyText);
                    toast({ title: "Copied", description: "Provider titles copied (lowercase, no spaces)." });
                  } catch (err) {
                    console.error(err);
                    toast({ title: "Copy failed", description: "Could not copy to clipboard.", variant: "destructive" });
                  }
                }}
                className="h-8"
              >
                <Clipboard className="w-4 h-4 mr-1" />
                Copy titles
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={!providerAssets.length}
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(providerCopyTextNormal);
                    toast({ title: "Copied", description: "Provider titles copied (original format)." });
                  } catch (err) {
                    console.error(err);
                    toast({ title: "Copy failed", description: "Could not copy to clipboard.", variant: "destructive" });
                  }
                }}
                className="h-8"
              >
                <Clipboard className="w-4 h-4 mr-1" />
                Copy normal titles
              </Button>
            </div>
          </div>

        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto scrollbar-thin">
          <table ref={tableRef} className="w-full border-collapse select-none">
            <thead className="sticky top-0 z-10">
              <tr className="bg-muted/80 backdrop-blur-sm border-b border-border">
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">
                  Game Name
                </th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">
                  Brands
                </th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">
                  Notes
                </th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">
                  Status
                </th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">
                  Designer
                </th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">
                  Found By
                </th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">
                  Date Found
                </th>
                <th className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {providerAssets.map((asset, index) => (
                <tr
                  key={asset.id}
                  onClick={() => onAssetClick(asset)}
                  className={`
                    cursor-pointer transition-colors duration-100 border-b border-border/30
                    ${index % 2 === 0 ? "bg-card" : "bg-muted/10"}
                    hover:bg-muted/30
                    ${isInDragRange(index) && dragType === "status" ? "!bg-primary/15" : ""}
                    ${isInDragRange(index) && dragType === "designer" ? "!bg-blue-500/15" : ""}
                  `}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Gamepad2 className="w-4 h-4 text-muted-foreground" />
                      <div className="flex flex-col leading-tight">
                        <p className="font-medium text-foreground text-sm">
                          {asset.gameName}
                        </p>
                        <p className="text-xs text-muted-foreground lowercase">
                          {asset.gameName.toLowerCase().replace(/\s+/g, "")}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-foreground"
                        onClick={async (e) => {
                          e.stopPropagation();
                          try {
                            await navigator.clipboard.writeText(asset.gameName);
                            toast({ title: "Copied", description: "Game name copied." });
                          } catch (err) {
                            console.error(err);
                            toast({ title: "Copy failed", description: "Could not copy name.", variant: "destructive" });
                          }
                        }}
                        aria-label="Copy game name"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      {asset.brands.slice(0, 2).map((brand) => (
                        <div key={brand.id} className="flex items-center gap-1.5">
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: brand.color }}
                          />
                          <span className="text-xs text-foreground truncate max-w-[70px]">
                            {brand.name}
                          </span>
                          {brand.reflected ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-success shrink-0" />
                          ) : (
                            <XCircle className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0" />
                          )}
                        </div>
                      ))}
                      {asset.brands.length > 2 && (
                        <span className="text-xs text-muted-foreground">
                          +{asset.brands.length - 2} more
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 max-w-xs">
                    <span className="text-sm text-muted-foreground line-clamp-2">
                      {asset.notes || "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-1 group">
                      <div
                        className="cursor-grab active:cursor-grabbing p-1 -ml-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-muted rounded"
                        onMouseDown={(e) => handleDragStart(e, index, "status", asset.status)}
                        title="Drag to fill"
                      >
                        <GripVertical className="w-3 h-3 text-muted-foreground" />
                      </div>
                      <Select
                        value={asset.status}
                        onValueChange={(v) =>
                          onStatusChange(asset.id, v as AssetStatus)
                        }
                      >
                        <SelectTrigger className="w-28 h-7 border-0 bg-transparent p-0 hover:bg-muted/50 rounded transition-colors">
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
                  </td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-1 group">
                      <div
                        className="cursor-grab active:cursor-grabbing p-1 -ml-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-muted rounded"
                        onMouseDown={(e) => handleDragStart(e, index, "designer", asset.designer?.id || "unassigned")}
                        title="Drag to fill"
                      >
                        <GripVertical className="w-3 h-3 text-muted-foreground" />
                      </div>
                      <Select
                        value={asset.designer?.id || "unassigned"}
                        onValueChange={(v) => onDesignerChange(asset.id, v)}
                      >
                        <SelectTrigger className="w-32 h-7 border-0 bg-transparent p-0 hover:bg-muted/50 rounded transition-colors">
                          <DesignerAvatar designer={asset.designer} size="sm" />
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
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-muted-foreground">
                      {asset.foundBy}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-muted-foreground tabular-nums">
                      {new Date(asset.dateFound).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 hover:bg-destructive/10 text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteRequest(asset);
                        }}
                        aria-label="Delete asset"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto scrollbar-thin p-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {sortedProviders.map((provider) => {
          const providerAssets = providerGroups[provider];
          const statusSummary = getStatusSummary(providerAssets);
          const completedCount = statusSummary.completed + statusSummary.exported + statusSummary.uploaded;
          const totalCount = providerAssets.length;
          const completionPercentage = Math.round((completedCount / totalCount) * 100);

          return (
            <button
              key={provider}
              onClick={() => setOpenProvider(provider)}
              className="group flex flex-col items-center p-4 rounded-xl border border-border bg-card hover:bg-muted/50 hover:border-primary/30 transition-all duration-200 hover:shadow-md"
            >
              {/* Folder Icon */}
              <div className="relative mb-3">
                <Folder className="w-16 h-16 text-amber-500 group-hover:text-amber-400 transition-colors" />
                <div className="absolute bottom-1 right-0 bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                  {totalCount}
                </div>
              </div>

              {/* Provider Name */}
              <h3 className="font-medium text-sm text-foreground text-center truncate w-full mb-2">
                {provider}
              </h3>

              {/* Progress Bar */}
              <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden mb-2">
                <div
                  className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-300"
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>

              {/* Status Summary */}
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                  {statusSummary["not-started"]}
                </span>
                <span className="flex items-center gap-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  {statusSummary.ongoing}
                </span>
                <span className="flex items-center gap-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  {completedCount}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {sortedProviders.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mb-4">
            <Folder className="w-6 h-6 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground font-medium">No providers found</p>
          <p className="text-sm text-muted-foreground mt-1">
            Add some assets to see them organized by provider
          </p>
        </div>
      )}
    </div>
  );
}
