import { useState, useRef, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { StatusBadge } from "@/components/StatusBadge";
import { DesignerAvatar } from "@/components/DesignerAvatar";
import { MissingAsset, AssetStatus, statusConfig, Brand } from "@/types/asset";
import { PageLoader } from "@/components/PageLoader";
import { useMinimumLoader } from "@/hooks/use-minimum-loader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Plus,
  Copy,
  Share2,
  CheckCircle2,
  XCircle,
  GripVertical,
  Folder,
  Table as TableIcon,
  X,
  SlidersHorizontal,
  Gamepad2,
} from "lucide-react";
import { AssetDetailsPanel } from "@/components/AssetDetailsPanel";
import { AddAssetModal } from "@/components/AddAssetModal";
import { ProviderFolderView } from "@/components/ProviderFolderView";
import { MultiSelectFilter, MultiSelectOption } from "@/components/MultiSelectFilter";
import { useToast } from "@/hooks/use-toast";
import { useAssets, useDesigners, useBrands, useProviders } from "@/hooks/useData";
import { Toggle } from "@/components/ui/toggle";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertTriangle } from "lucide-react";

type ViewMode = "table" | "board";

export default function MissingAssets() {
  // Data hooks - uses Supabase if configured, otherwise mockData
  const {
    assets,
    setAssets,
    loading,
    isUsingSupabase,
    addAsset,
    updateStatus,
    updateDesigner,
    updateProvider,
    updateBrandReflection,
    addBrandsToAsset,
    updateAssetBrands,
  } = useAssets();
  const { designers } = useDesigners();
  const { brands: brandOptions } = useBrands();
  const { providers: providerOptions } = useProviders();
  const showLoader = useMinimumLoader(loading, 1500);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<AssetStatus | "all">("all");
  const [selectedAsset, setSelectedAsset] = useState<MissingAsset | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const { toast } = useToast();

  // Status change confirmation for uploaded assets
  const [statusChangeConfirm, setStatusChangeConfirm] = useState<{
    assetId: string;
    assetName: string;
    newStatus: AssetStatus;
  } | null>(null);

  // View mode with localStorage persistence
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const saved = localStorage.getItem("assetViewMode");
    return (saved as ViewMode) || "table";
  });

  // Multi-select filters
  const [selectedProviders, setSelectedProviders] = useState<string[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedDesigners, setSelectedDesigners] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  // Drag-to-fill state
  const [isDragging, setIsDragging] = useState(false);
  const [dragType, setDragType] = useState<"status" | "designer" | null>(null);
  const [dragStartIndex, setDragStartIndex] = useState<number | null>(null);
  const [dragCurrentIndex, setDragCurrentIndex] = useState<number | null>(null);
  const [dragValue, setDragValue] = useState<AssetStatus | string | null>(null);
  const tableRef = useRef<HTMLTableElement>(null);
  const tableContainerRef = useRef<HTMLDivElement>(null);

  // Refs to track drag state for event listeners
  const dragStateRef = useRef({
    isDragging: false,
    dragType: null as "status" | "designer" | null,
    startIndex: null as number | null,
    currentIndex: null as number | null,
    value: null as AssetStatus | string | null,
  });

  // Persist view mode
  useEffect(() => {
    localStorage.setItem("assetViewMode", viewMode);
  }, [viewMode]);

  // Filter options
  const providerFilterOptions: MultiSelectOption[] = providerOptions.map((p) => ({
    value: p,
    label: p,
  }));

  const brandFilterOptions: MultiSelectOption[] = brandOptions.map((b) => ({
    value: b.id,
    label: b.name,
    color: b.color,
  }));

  const designerFilterOptions: MultiSelectOption[] = [
    { value: "unassigned", label: "Unassigned" },
    ...designers.map((d) => ({
      value: d.id,
      label: d.name,
    })),
  ];

  // Filtered assets (computed even during loading to maintain hook consistency)
  const filteredAssets = assets.filter((asset) => {
    const matchesSearch =
      asset.gameName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.provider.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || asset.status === statusFilter;
    const matchesProvider =
      selectedProviders.length === 0 || selectedProviders.includes(asset.provider);
    const matchesBrand =
      selectedBrands.length === 0 ||
      asset.brands.some((b) => selectedBrands.includes(b.id));
    const matchesDesigner =
      selectedDesigners.length === 0 ||
      (asset.designer
        ? selectedDesigners.includes(asset.designer.id)
        : selectedDesigners.includes("unassigned"));

    return matchesSearch && matchesStatus && matchesProvider && matchesBrand && matchesDesigner;
  });

  const activeFilterCount =
    selectedProviders.length + selectedBrands.length + selectedDesigners.length;

  const clearAllFilters = () => {
    setSelectedProviders([]);
    setSelectedBrands([]);
    setSelectedDesigners([]);
    setStatusFilter("all");
    setSearchQuery("");
  };

  const handleCopyDoc = (asset: MissingAsset) => {
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

  const handleShare = (asset: MissingAsset) => {
    toast({
      title: "Share link created",
      description: "Link copied to clipboard (demo)",
    });
  };

  const handleStatusChange = (assetId: string, newStatus: AssetStatus) => {
    // Find the asset to check its current status
    const asset = assets.find((a) => a.id === assetId);
    
    // If current status is "uploaded", show confirmation dialog
    if (asset && asset.status === "uploaded" && newStatus !== "uploaded") {
      setStatusChangeConfirm({
        assetId,
        assetName: asset.gameName,
        newStatus,
      });
      return;
    }

    // Otherwise, proceed with the status change
    applyStatusChange(assetId, newStatus);
  };

  const applyStatusChange = async (assetId: string, newStatus: AssetStatus) => {
    const success = await updateStatus(assetId, newStatus);
    if (success && selectedAsset?.id === assetId) {
      setSelectedAsset((prev) => (prev ? { ...prev, status: newStatus } : null));
    }
  };

  const confirmStatusChange = () => {
    if (statusChangeConfirm) {
      applyStatusChange(statusChangeConfirm.assetId, statusChangeConfirm.newStatus).then(() => {
        toast({
          title: "Status changed",
          description: `${statusChangeConfirm.assetName} status has been changed from Uploaded to ${statusConfig[statusChangeConfirm.newStatus].label}.`,
        });
        setStatusChangeConfirm(null);
      });
    }
  };

  const handleDesignerChange = async (assetId: string, designerId: string) => {
    const designer = designers.find((d) => d.id === designerId) || null;
    const success = await updateDesigner(assetId, designer);
    if (success && selectedAsset?.id === assetId) {
      setSelectedAsset((prev) => (prev ? { ...prev, designer } : null));
    }
  };

  const handleProviderChange = async (assetId: string, providerName: string) => {
    const success = await updateProvider(assetId, providerName);
    if (success && selectedAsset?.id === assetId) {
      setSelectedAsset((prev) => (prev ? { ...prev, provider: providerName } : null));
    }
    return success;
  };

  const handleBrandSelectionChange = async (assetId: string, brandIds: string[]) => {
    const asset = assets.find((a) => a.id === assetId);
    const brands: Brand[] = brandIds
      .map((id) => {
        const existing = asset?.brands.find((b) => b.id === id);
        if (existing) return existing;
        const catalogBrand = brandOptions.find((b) => b.id === id);
        return catalogBrand
          ? { ...catalogBrand, reflected: false }
          : null;
      })
      .filter(Boolean) as Brand[];

    const success = await updateAssetBrands(assetId, brands);
    if (success && selectedAsset?.id === assetId) {
      setSelectedAsset((prev) => (prev ? { ...prev, brands } : null));
    }
    return success;
  };

  const handleBrandReflectionToggle = (assetId: string, brandId: string, reflected: boolean) => {
    const currentUser = "Current User";
    updateBrandReflection(assetId, brandId, reflected, currentUser).then((success) => {
      if (success && selectedAsset?.id === assetId) {
        setSelectedAsset((prev) =>
          prev
            ? {
                ...prev,
                brands: prev.brands.map((b) =>
                  b.id === brandId
                    ? {
                        ...b,
                        reflected,
                        reflectedBy: reflected ? currentUser : undefined,
                        reflectedAt: reflected ? new Date().toISOString().split("T")[0] : undefined,
                      }
                    : b
                ),
              }
            : null
        );
      }

      if (success) {
        toast({
          title: reflected ? "Marked as reflected" : "Marked as not reflected",
          description: "Brand verification updated.",
        });
      } else {
        toast({ title: "Update failed", description: "Could not update brand reflection.", variant: "destructive" });
      }
    });
  };

  const handleAddAsset = async (newAsset: MissingAsset) => {
    const { id: _ignoreId, createdAt: _c, updatedAt: _u, ...payload } = newAsset;
    const created = await addAsset(payload);
    setShowAddModal(false);
    if (created) {
      toast({ title: "Asset added", description: `${created.gameName} has been added to the list.` });
    } else {
      toast({ title: "Add failed", description: "Could not add asset.", variant: "destructive" });
    }
  };

  const handleAddBrandsToExisting = async (assetId: string, brands: import("@/types/asset").Brand[]) => {
    const success = await addBrandsToAsset(assetId, brands);
    setShowAddModal(false);
    const asset = assets.find((a) => a.id === assetId);
    if (success) {
      toast({
        title: "Brands added",
        description: `${brands.length} brand${brands.length !== 1 ? "s" : ""} added to ${asset?.gameName || "existing asset"}.`,
      });
    } else {
      toast({ title: "Add failed", description: "Could not add brands to asset.", variant: "destructive" });
    }
  };

  // Drag-to-fill handlers
  const handleDragStart = (
    e: React.MouseEvent,
    index: number,
    type: "status" | "designer",
    value: AssetStatus | string
  ) => {
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
      value: value,
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
    const { isDragging, startIndex, currentIndex, value, dragType } = dragStateRef.current;
    
    if (isDragging && startIndex !== null && currentIndex !== null && value !== null) {
      const startIdx = Math.min(startIndex, currentIndex);
      const endIdx = Math.max(startIndex, currentIndex);

      if (startIdx !== endIdx) {
        const affectedAssets = filteredAssets.slice(startIdx, endIdx + 1);
        const updateCount = affectedAssets.length;

        if (dragType === "status") {
          setAssets((prev) =>
            prev.map((asset) => {
              const isAffected = affectedAssets.some((a) => a.id === asset.id);
              if (isAffected) {
                return {
                  ...asset,
                  status: value as AssetStatus,
                  updatedAt: new Date().toISOString(),
                };
              }
              return asset;
            })
          );
          toast({
            title: "Bulk status update",
            description: `Updated ${updateCount} assets to "${statusConfig[value as AssetStatus].label}"`,
          });
        } else if (dragType === "designer") {
          const designer = value === "unassigned" ? null : designers.find((d) => d.id === value) || null;
          setAssets((prev) =>
            prev.map((asset) => {
              const isAffected = affectedAssets.some((a) => a.id === asset.id);
              if (isAffected) {
                return {
                  ...asset,
                  designer,
                  updatedAt: new Date().toISOString(),
                };
              }
              return asset;
            })
          );
          toast({
            title: "Bulk designer update",
            description: `Updated ${updateCount} assets to "${designer?.name || "Unassigned"}"`,
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

  // Horizontal scroll with mouse wheel (shift + scroll)
  useEffect(() => {
    const container = tableContainerRef.current;
    if (!container || viewMode !== "table") return;

    const handleWheel = (e: WheelEvent) => {
      if (e.shiftKey) {
        e.preventDefault();
        container.scrollLeft += e.deltaY;
      }
    };

    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => container.removeEventListener("wheel", handleWheel);
  }, [viewMode]);

  // Show loading state (placed after all hooks to maintain hook consistency)
  if (showLoader) {
    return (
      <AppLayout>
        <PageLoader message="Loading assets..." isUsingSupabase={isUsingSupabase} />
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="flex h-full">
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Header */}
          <div className="p-4 lg:p-5 border-b border-border bg-card shrink-0">
            <div className="flex flex-col gap-4">
              {/* Top Row: Title + Actions */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div>
                    <h1 className="text-lg lg:text-xl font-semibold text-foreground">
                      Missing Assets
                    </h1>
                    <p className="text-xs text-muted-foreground">
                      {filteredAssets.length} of {assets.length} assets
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* View Toggle */}
                  <div className="flex items-center bg-muted rounded-lg p-0.5">
                    <Toggle
                      pressed={viewMode === "table"}
                      onPressedChange={() => setViewMode("table")}
                      size="sm"
                      className="h-7 px-2.5 data-[state=on]:bg-background data-[state=on]:shadow-sm"
                    >
                      <TableIcon className="w-4 h-4" />
                    </Toggle>
                    <Toggle
                      pressed={viewMode === "board"}
                      onPressedChange={() => setViewMode("board")}
                      size="sm"
                      className="h-7 px-2.5 data-[state=on]:bg-background data-[state=on]:shadow-sm"
                    >
                      <Folder className="w-4 h-4" />
                    </Toggle>
                  </div>

                  <Button onClick={() => setShowAddModal(true)} size="sm">
                    <Plus className="w-4 h-4 mr-1" />
                    Add Asset
                  </Button>
                </div>
              </div>

              {/* Filters Row */}
              <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
                {/* Search */}
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search games..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 h-9"
                  />
                </div>

                {/* Filter Toggle */}
                <Button
                  variant={showFilters ? "secondary" : "outline"}
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className="h-9"
                >
                  <SlidersHorizontal className="w-4 h-4 mr-2" />
                  Filters
                  {activeFilterCount > 0 && (
                    <Badge variant="default" className="ml-2 h-5 px-1.5 text-xs">
                      {activeFilterCount}
                    </Badge>
                  )}
                </Button>

                {/* Status Filter */}
                <Select
                  value={statusFilter}
                  onValueChange={(v) => setStatusFilter(v as AssetStatus | "all")}
                >
                  <SelectTrigger className="w-full lg:w-40 h-9">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    {Object.entries(statusConfig).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        {config.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Clear Filters */}
                {(activeFilterCount > 0 || searchQuery || statusFilter !== "all") && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAllFilters}
                    className="h-9 text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Clear
                  </Button>
                )}
              </div>

              {/* Advanced Filters */}
              {showFilters && (
                <div className="flex flex-wrap gap-3 pt-2 border-t border-border">
                  <MultiSelectFilter
                    options={providerFilterOptions}
                    selected={selectedProviders}
                    onChange={setSelectedProviders}
                    placeholder="Provider"
                    className="w-48"
                  />
                  <MultiSelectFilter
                    options={brandFilterOptions}
                    selected={selectedBrands}
                    onChange={setSelectedBrands}
                    placeholder="Brand"
                    className="w-48"
                  />
                  <MultiSelectFilter
                    options={designerFilterOptions}
                    selected={selectedDesigners}
                    onChange={setSelectedDesigners}
                    placeholder="Designer"
                    className="w-48"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Content Area */}
          {viewMode === "table" ? (
            /* Table View */
            <div
              ref={tableContainerRef}
              className="flex-1 overflow-auto scrollbar-thin"
            >
              <div className="min-w-[1000px]">
                <table ref={tableRef} className="w-full border-collapse select-none">
                  <thead className="sticky top-0 z-10">
                    <tr className="bg-muted/80 backdrop-blur-sm border-b border-border">
                      <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">
                        Game Name
                      </th>
                      <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">
                        Provider
                      </th>
                      <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">
                        Brands
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
                    {filteredAssets.map((asset, index) => (
                      <tr
                        key={asset.id}
                        onClick={() => setSelectedAsset(asset)}
                        className={`
                          cursor-pointer transition-colors duration-100 border-b border-border/30
                          ${index % 2 === 0 ? "bg-card" : "bg-muted/10"}
                          ${selectedAsset?.id === asset.id 
                            ? "!bg-primary/8 ring-1 ring-primary/20 ring-inset" 
                            : "hover:bg-muted/30"
                          }
                          ${isInDragRange(index) && dragType === "status" ? "!bg-primary/15" : ""}
                          ${isInDragRange(index) && dragType === "designer" ? "!bg-blue-500/15" : ""}
                        `}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Gamepad2 className="w-4 h-4 text-muted-foreground" />
                            <p className="font-medium text-foreground text-sm">
                              {asset.gameName}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-muted-foreground">
                            {asset.provider}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-1.5">
                            {asset.brands.slice(0, 2).map((brand) => (
                              <div
                                key={brand.id}
                                className="flex items-center gap-1.5"
                              >
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
                                handleStatusChange(asset.id, v as AssetStatus)
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
                              onValueChange={(v) => handleDesignerChange(asset.id, v)}
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
                          <div className="flex items-center justify-end gap-0.5">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 hover:bg-muted rounded transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopyDoc(asset);
                              }}
                            >
                              <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 hover:bg-muted rounded transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleShare(asset);
                              }}
                            >
                              <Share2 className="w-3.5 h-3.5 text-muted-foreground" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredAssets.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                    <Search className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground font-medium">No assets found</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Try adjusting your filters
                  </p>
                </div>
              )}
            </div>
          ) : (
            /* Provider Folder View */
            <ProviderFolderView
              assets={filteredAssets}
              designers={designers}
              onStatusChange={handleStatusChange}
              onDesignerChange={handleDesignerChange}
              onAssetClick={setSelectedAsset}
              onCopyDoc={handleCopyDoc}
              onShare={handleShare}
            />
          )}
        </div>
      </div>

      {/* Details Modal */}
      {selectedAsset && (
        <AssetDetailsPanel
          asset={selectedAsset}
          onClose={() => setSelectedAsset(null)}
          onStatusChange={handleStatusChange}
          onDesignerChange={handleDesignerChange}
          onBrandReflectionToggle={handleBrandReflectionToggle}
          onProviderChange={handleProviderChange}
          onBrandsChange={handleBrandSelectionChange}
          providerOptions={providerOptions}
          brandOptions={brandOptions}
        />
      )}

      {/* Add Modal */}
      <AddAssetModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddAsset}
        onAddBrandsToExisting={handleAddBrandsToExisting}
        existingAssets={assets}
      />

      {/* Status Change Confirmation Dialog */}
      <AlertDialog open={!!statusChangeConfirm} onOpenChange={() => setStatusChangeConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Change Status from Uploaded?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                You are about to change the status of <strong>"{statusChangeConfirm?.assetName}"</strong> from{" "}
                <span className="text-emerald-500 font-medium">Uploaded</span> to{" "}
                <span className="text-primary font-medium">
                  {statusChangeConfirm && statusConfig[statusChangeConfirm.newStatus].label}
                </span>.
              </p>
              <p className="text-muted-foreground">
                This asset has already been uploaded. Are you sure you want to change its status?
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmStatusChange}>
              Accept
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
