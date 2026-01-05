import { useState, useRef, useEffect, useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { StatusBadge } from "@/components/StatusBadge";
import { DesignerAvatar } from "@/components/DesignerAvatar";
import { MissingAsset, AssetStatus, statusConfig, Brand } from "@/types/asset";
import { PageLoader } from "@/components/PageLoader";
import { useMinimumLoader } from "@/hooks/use-minimum-loader";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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
  CheckCircle2,
  XCircle,
  GripVertical,
  Folder,
  Table as TableIcon,
  X,
  SlidersHorizontal,
  Gamepad2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Trash2,
  ListChecks,
  Copy,
} from "lucide-react";
import { AssetDetailsPanel } from "@/components/AssetDetailsPanel";
import { AddAssetModal } from "@/components/AddAssetModal";
import { ProviderFolderView } from "@/components/ProviderFolderView";
import { MultiSelectFilter, MultiSelectOption } from "@/components/MultiSelectFilter";
import { useToast } from "@/hooks/use-toast";
import { useAssets, useDesigners, useBrands, useProviders } from "@/hooks/useData";
import { Toggle } from "@/components/ui/toggle";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
    updateGameName,
    updateDesigner,
    updateProvider,
    updateNotes,
    updateBrandReflection,
    addBrandsToAsset,
    updateAssetBrands,
    deleteAsset,
    refetch,
  } = useAssets();
  const { designers } = useDesigners();
  const { brands: brandOptions } = useBrands();
  const { providers: providerOptions } = useProviders();
  const showLoader = useMinimumLoader(loading, 1500);

  const [searchQuery, setSearchQuery] = useState(() => localStorage.getItem("missingAssetsSearch") || "");
  const [showMultiSearchModal, setShowMultiSearchModal] = useState(false);
  const [multiSearchInput, setMultiSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState<AssetStatus | "all">(() => {
    const saved = localStorage.getItem("missingAssetsStatus");
    return saved && saved !== "" ? (saved as AssetStatus | "all") : "all";
  });
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">(() => {
    const saved = localStorage.getItem("missingAssetsSortOrder");
    return saved === "desc" ? "desc" : "asc";
  });
  const [selectedAsset, setSelectedAsset] = useState<MissingAsset | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkUpdateModal, setShowBulkUpdateModal] = useState(false);
  const { toast } = useToast();
  const [deleteConfirm, setDeleteConfirm] = useState<MissingAsset | null>(null);
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkGamesInput, setBulkGamesInput] = useState("");
  const [bulkStatus, setBulkStatus] = useState<AssetStatus | null>(null);
  const [bulkDesigner, setBulkDesigner] = useState<string | null>(null);
  const [bulkProvider, setBulkProvider] = useState<string | null>(null);
  const [bulkProviderFilter, setBulkProviderFilter] = useState("");
  const [bulkBusy, setBulkBusy] = useState(false);

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
  const [selectedProviders, setSelectedProviders] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("missingAssetsProviders");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [selectedBrands, setSelectedBrands] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("missingAssetsBrands");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [selectedDesigners, setSelectedDesigners] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("missingAssetsDesigners");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(() => {
    const saved = Number.parseInt(localStorage.getItem("missingAssetsPage") || "1", 10);
    return Number.isNaN(saved) || saved < 1 ? 1 : saved;
  });
  const [pageSize, setPageSize] = useState(() => {
    const saved = Number.parseInt(localStorage.getItem("missingAssetsPageSize") || "10", 10);
    if (Number.isNaN(saved) || saved < 10) return 10;
    if (saved > 100) return 100;
    return saved;
  });

  // Drag-to-fill state
  const [isDragging, setIsDragging] = useState(false);
  const [dragType, setDragType] = useState<"status" | "designer" | null>(null);
  const [dragStartIndex, setDragStartIndex] = useState<number | null>(null);
  const [dragCurrentIndex, setDragCurrentIndex] = useState<number | null>(null);
  const [dragValue, setDragValue] = useState<AssetStatus | string | null>(null);
  const tableRef = useRef<HTMLTableElement>(null);
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const didInitFilters = useRef(false);

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

  useEffect(() => {
    localStorage.setItem("missingAssetsSearch", searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    localStorage.setItem("missingAssetsStatus", statusFilter);
  }, [statusFilter]);

  useEffect(() => {
    localStorage.setItem("missingAssetsProviders", JSON.stringify(selectedProviders));
  }, [selectedProviders]);

  useEffect(() => {
    localStorage.setItem("missingAssetsBrands", JSON.stringify(selectedBrands));
  }, [selectedBrands]);

  useEffect(() => {
    localStorage.setItem("missingAssetsDesigners", JSON.stringify(selectedDesigners));
  }, [selectedDesigners]);

  useEffect(() => {
    localStorage.setItem("missingAssetsSortOrder", sortOrder);
  }, [sortOrder]);

  useEffect(() => {
    localStorage.setItem("missingAssetsPageSize", String(pageSize));
  }, [pageSize]);

  // Drop selections that no longer exist
  useEffect(() => {
    setSelectedIds((prev) => prev.filter((id) => assets.some((a) => a.id === id)));
  }, [assets]);

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

  const filteredBulkProviders = useMemo(
    () =>
      providerOptions.filter((p) =>
        p.toLowerCase().includes(bulkProviderFilter.trim().toLowerCase())
      ),
    [providerOptions, bulkProviderFilter]
  );

  const normalizeName = (name: string) => name.toLowerCase().trim().replace(/\s+/g, " ");

  const parsedSearchTerms = useMemo(() =>
    searchQuery
      .split("\n")
      .map((s) => s.trim().toLowerCase())
      .filter((s) => s.length > 0),
    [searchQuery]
  );

  const missingSearchTerms = useMemo(
    () =>
      parsedSearchTerms.filter(
        (term) => !assets.some((a) => normalizeName(a.gameName).includes(term))
      ),
    [parsedSearchTerms, assets]
  );

  const multiSearchTerms = useMemo(
    () =>
      multiSearchInput
        .split("\n")
        .map((s) => s.trim().toLowerCase())
        .filter((s) => s.length > 0),
    [multiSearchInput]
  );

  const multiSearchMissing = useMemo(
    () =>
      multiSearchTerms.filter(
        (term) => !assets.some((a) => normalizeName(a.gameName).includes(term))
      ),
    [multiSearchTerms, assets]
  );

  const multiSearchMatches = useMemo(
    () => {
      if (multiSearchTerms.length === 0) return [] as MissingAsset[];
      const set = new Set<string>();
      const results: MissingAsset[] = [];
      assets.forEach((asset) => {
        if (multiSearchTerms.some((term) => normalizeName(asset.gameName).includes(term))) {
          if (!set.has(asset.id)) {
            set.add(asset.id);
            results.push(asset);
          }
        }
      });
      return results;
    },
    [multiSearchTerms, assets]
  );

  // Filtered assets (computed even during loading to maintain hook consistency)

  const filteredAssets = assets.filter((asset) => {
    const matchesSearch =
      parsedSearchTerms.length === 0 ||
      parsedSearchTerms.some((term) =>
        asset.gameName.toLowerCase().includes(term) ||
        asset.provider.toLowerCase().includes(term)
      );
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

  const sortedAssets = useMemo(() => {
    const arr = [...filteredAssets];
    arr.sort((a, b) => a.gameName.localeCompare(b.gameName));
    if (sortOrder === "desc") arr.reverse();
    return arr;
  }, [filteredAssets, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(sortedAssets.length / pageSize));
  const clampedPage = Math.min(page, totalPages);
  const paginatedAssets = sortedAssets.slice(
    (clampedPage - 1) * pageSize,
    clampedPage * pageSize
  );
  const showingStart = sortedAssets.length === 0 ? 0 : (clampedPage - 1) * pageSize + 1;
  const showingEnd = Math.min(clampedPage * pageSize, sortedAssets.length);

  useEffect(() => {
    if (!didInitFilters.current) {
      didInitFilters.current = true;
      return;
    }
    setPage(1);
  }, [searchQuery, statusFilter, selectedProviders, selectedBrands, selectedDesigners, viewMode]);

  useEffect(() => {
    if (loading) return;
    const maxPage = Math.max(1, Math.ceil(sortedAssets.length / pageSize));
    setPage((prev) => (prev > maxPage ? maxPage : prev));
  }, [loading, sortedAssets.length, pageSize]);

  useEffect(() => {
    localStorage.setItem("missingAssetsPage", String(clampedPage));
  }, [clampedPage]);

  const activeFilterCount =
    selectedProviders.length + selectedBrands.length + selectedDesigners.length;

  const clearAllFilters = () => {
    setSelectedProviders([]);
    setSelectedBrands([]);
    setSelectedDesigners([]);
    setStatusFilter("all");
    setSearchQuery("");
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleSelectPage = () => {
    const pageIds = paginatedAssets.map((a) => a.id);
    const allSelected = pageIds.every((id) => selectedIds.includes(id));
    if (allSelected) {
      setSelectedIds((prev) => prev.filter((id) => !pageIds.includes(id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...pageIds])));
    }
  };

  const handleDeleteAsset = async () => {
    if (!deleteConfirm) return;
    const assetName = deleteConfirm.gameName;
    const success = await deleteAsset(deleteConfirm.id);
    if (success) {
      if (selectedAsset?.id === deleteConfirm.id) {
        setSelectedAsset(null);
      }
      toast({
        title: "Asset deleted",
        description: `${assetName} has been removed.`,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Delete failed",
        description: "Could not delete asset. Please try again.",
        variant: "destructive",
      });
    }
    setDeleteConfirm(null);
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    const idsToDelete = selectedIds;
    const results = await Promise.all(idsToDelete.map((id) => deleteAsset(id)));
    const successes = results.filter(Boolean).length;
    const failures = idsToDelete.length - successes;

    setSelectedIds((prev) => prev.filter((id) => !idsToDelete.includes(id)));
    setBulkDeleteConfirm(false);

    if (successes > 0) {
      toast({
        title: "Assets deleted",
        description: `Removed ${successes} asset${successes !== 1 ? "s" : ""}.`,
        variant: "destructive",
      });
    }
    if (failures > 0) {
      toast({
        title: "Some deletions failed",
        description: `${failures} item${failures !== 1 ? "s" : ""} could not be removed.`,
        variant: "destructive",
      });
    }
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

  const handleGameNameChange = async (assetId: string, gameName: string) => {
    const success = await updateGameName(assetId, gameName);
    if (success && selectedAsset?.id === assetId) {
      setSelectedAsset((prev) => (prev ? { ...prev, gameName } : null));
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

  const handleNotesChange = async (assetId: string, notes: string) => {
    const success = await updateNotes(assetId, notes);
    if (success && selectedAsset?.id === assetId) {
      setSelectedAsset((prev) => (prev ? { ...prev, notes } : null));
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

  const handleBulkStatusUpdate = async (applyDesigner: boolean) => {
    try {
    const names = bulkGamesInput
      .split("\n")
      .map((n) => n.trim())
      .filter((n) => n.length > 0);

    if (!bulkProvider) {
      toast({ title: "Select provider", description: "Pick the provider to match these titles." });
      return;
    }

    if (names.length === 0 || !bulkStatus) {
      toast({ title: "Add details", description: "Add at least one game and choose a status." });
      return;
    }

    if (applyDesigner && !bulkDesigner) {
      toast({ title: "Select a designer", description: "Choose a designer or set to Unassigned." });
      return;
    }

    setBulkBusy(true);

    const providerLower = bulkProvider.toLowerCase();
    const nameMap = new Map<string, MissingAsset>();
    assets
      .filter((asset) => asset.provider.toLowerCase() === providerLower)
      .forEach((asset) => {
        nameMap.set(normalizeName(asset.gameName), asset);
      });

    const matched: MissingAsset[] = [];
    const missing: string[] = [];

    names.forEach((name) => {
      const found = nameMap.get(normalizeName(name));
      if (found) matched.push(found);
      else missing.push(name);
    });

    const safeDesigners = designers || [];
    const targetDesigner = applyDesigner
      ? bulkDesigner === "unassigned"
        ? null
        : safeDesigners.find((d) => d.id === bulkDesigner) || null
      : null;

    const updatedAssets = new Map<string, MissingAsset>();

    const updateResults = await Promise.all(
      matched.map(async (asset) => {
        const statusOk = await updateStatus(asset.id, bulkStatus);
        let designerOk = false;
        let updated: MissingAsset | null = null;

        if (statusOk) {
          updated = { ...asset, status: bulkStatus, updatedAt: new Date().toISOString() };

          if (applyDesigner) {
            designerOk = await updateDesigner(asset.id, targetDesigner);
            if (designerOk) {
              updated = { ...updated, designer: targetDesigner };
            }
          }

          updatedAssets.set(asset.id, updated);
        }

        return { statusOk, designerOk };
      })
    );

    const statusSuccess = updateResults.filter((r) => r.statusOk).length;
    const designerSuccess = updateResults.filter((r) => r.designerOk).length;

    if (updatedAssets.size > 0) {
      setAssets((prev) =>
        prev.map((asset) => updatedAssets.get(asset.id) || asset)
      );
    }

    if (selectedAsset && updatedAssets.has(selectedAsset.id)) {
      setSelectedAsset(updatedAssets.get(selectedAsset.id) || null);
    }

    const summaries = [] as string[];
    if (statusSuccess > 0) summaries.push(`${statusSuccess} status updated`);
    if (applyDesigner) summaries.push(`${designerSuccess} designer set`);
    if (missing.length > 0) summaries.push(`${missing.length} not found`);

    toast({
      title: "Bulk update",
      description: summaries.join(" • ") || "No assets updated",
      variant: statusSuccess === 0 ? "destructive" : "default",
    });

    if (missing.length === 0) {
      setBulkGamesInput("");
      setBulkStatus(null);
      setBulkDesigner(null);
      setBulkProvider(null);
      setShowBulkUpdateModal(false);
    }
    } catch (err) {
      console.error(err);
      toast({ title: "Update failed", description: "Something went wrong. Check console for details.", variant: "destructive" });
    } finally {
      setBulkBusy(false);
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

  const handleDragEnd = async () => {
    const { isDragging, startIndex, currentIndex, value, dragType } = dragStateRef.current;

    try {
      if (isDragging && startIndex !== null && currentIndex !== null && value !== null) {
        const startIdx = Math.min(startIndex, currentIndex);
        const endIdx = Math.max(startIndex, currentIndex);

        if (startIdx !== endIdx) {
          const affectedAssets = filteredAssets.slice(startIdx, endIdx + 1);
          const updateCount = affectedAssets.length;

          if (dragType === "status") {
            const newStatus = value as AssetStatus;

            // Optimistic UI update
            setAssets((prev) =>
              prev.map((asset) => {
                const isAffected = affectedAssets.some((a) => a.id === asset.id);
                if (isAffected) {
                  return {
                    ...asset,
                    status: newStatus,
                    updatedAt: new Date().toISOString(),
                  };
                }
                return asset;
              })
            );

            const results = await Promise.all(
              affectedAssets.map((asset) => updateStatus(asset.id, newStatus))
            );
            const failures = results.filter((r) => !r).length;

            if (failures > 0) {
              toast({
                title: "Some updates failed",
                description: `${updateCount - failures} saved, ${failures} failed. Please try again.`,
                variant: "destructive",
              });
              refetch();
            } else {
              toast({
                title: "Bulk status update",
                description: `Updated ${updateCount} assets to "${statusConfig[newStatus].label}"`,
              });
            }
          } else if (dragType === "designer") {
            const designer = value === "unassigned" ? null : designers.find((d) => d.id === value) || null;

            // Optimistic UI update
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

            const results = await Promise.all(
              affectedAssets.map((asset) => updateDesigner(asset.id, designer))
            );
            const failures = results.filter((r) => !r).length;

            if (failures > 0) {
              toast({
                title: "Some updates failed",
                description: `${updateCount - failures} saved, ${failures} failed. Please try again.`,
                variant: "destructive",
              });
              refetch();
            } else {
              toast({
                title: "Bulk designer update",
                description: `Updated ${updateCount} assets to "${designer?.name || "Unassigned"}"`,
              });
            }
          }
        }
      }
    } finally {
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
    }
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
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9"
                            onClick={refetch}
                            disabled={loading}
                          >
                            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Refresh assets (manual fetch)</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

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

                    <Button onClick={() => setShowBulkUpdateModal(true)} variant="outline" size="sm">
                      <CheckCircle2 className="w-4 h-4 mr-1" />
                      Quick Status
                    </Button>
                    <Button onClick={() => setShowAddModal(true)} size="sm">
                      <Plus className="w-4 h-4 mr-1" />
                      Add Asset
                    </Button>
                  </div>
              </div>

              {/* Filters Row */}
              <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
                {/* Search (single) + multi search modal trigger */}
                <div className="flex items-start gap-2 flex-1 max-w-md">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search games or providers"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 h-10"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-10 w-10"
                    title="Multi-title search"
                    onClick={() => {
                      setMultiSearchInput(searchQuery);
                      setShowMultiSearchModal(true);
                    }}
                  >
                    <ListChecks className="w-4 h-4" />
                  </Button>
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

                {/* Sort Order */}
                <Select value={sortOrder} onValueChange={(v) => setSortOrder(v as "asc" | "desc")}>
                  <SelectTrigger className="w-full lg:w-36 h-9">
                    <SelectValue placeholder="Sort" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asc">A → Z</SelectItem>
                    <SelectItem value="desc">Z → A</SelectItem>
                  </SelectContent>
                </Select>

                {/* Page size */}
                <Select
                  value={String(pageSize)}
                  onValueChange={(v) => setPageSize(Math.min(100, Math.max(10, Number(v))))}
                >
                  <SelectTrigger className="w-full lg:w-32 h-9">
                    <SelectValue placeholder="Rows" />
                  </SelectTrigger>
                  <SelectContent>
                    {[10, 20, 30, 40, 50, 75, 100].map((size) => (
                      <SelectItem key={size} value={String(size)}>
                        {size} / page
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
                      <th className="w-10 px-4 py-3">
                        <Checkbox
                          aria-label="Select page"
                          checked={
                            paginatedAssets.length > 0 &&
                            paginatedAssets.every((a) => selectedIds.includes(a.id))
                          }
                          onCheckedChange={toggleSelectPage}
                        />
                      </th>
                      <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 py-3">
                        Game Name
                      </th>
                      <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">
                        Provider
                      </th>
                      <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">
                        Notes
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
                    {paginatedAssets.map((asset, index) => (
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
                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            aria-label="Select asset"
                            checked={selectedIds.includes(asset.id)}
                            onCheckedChange={() => toggleSelect(asset.id)}
                          />
                        </td>
                        <td className="px-2 py-3">
                          <div className="flex items-center gap-2">
                            <Gamepad2 className="w-4 h-4 text-muted-foreground" />
                            <p className="font-medium text-foreground text-sm">
                              {asset.gameName}
                            </p>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-foreground"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigator.clipboard.writeText(asset.gameName).then(() => {
                                  toast({ title: "Copied", description: "Game name copied." });
                                }).catch((err) => {
                                  console.error(err);
                                  toast({ title: "Copy failed", description: "Could not copy name.", variant: "destructive" });
                                });
                              }}
                              aria-label="Copy game name"
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-muted-foreground">
                            {asset.provider}
                          </span>
                        </td>
                        <td className="px-4 py-3 max-w-xs">
                          <span className="text-sm text-muted-foreground line-clamp-2">
                            {asset.notes || "—"}
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
                          <div className="flex items-center justify-end">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 hover:bg-destructive/10 text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteConfirm(asset);
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

              {filteredAssets.length > 0 && (
                <div className="sticky bottom-0 left-0 right-0 flex flex-col gap-2 px-3 py-3 text-sm text-muted-foreground border-t border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:backdrop-blur-sm">
                  <div className="flex items-center justify-between">
                    <span>
                      Showing {showingStart}-{showingEnd} of {filteredAssets.length}
                    </span>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={clampedPage === 1}
                        className="h-8 px-2"
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Prev
                      </Button>
                      <span className="text-xs">
                        Page {clampedPage} of {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={clampedPage === totalPages}
                        className="h-8 px-2"
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {selectedIds.length > 0 && (
                    <div className="flex items-center justify-between rounded-md border border-border bg-muted/50 px-3 py-2 text-xs text-foreground">
                      <span className="font-medium">{selectedIds.length} selected</span>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 px-2"
                          onClick={() => setSelectedIds([])}
                        >
                          Clear
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="h-7 px-2"
                          onClick={() => setBulkDeleteConfirm(true)}
                        >
                          <Trash2 className="w-4 h-4 mr-1" /> Delete selected
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}

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
              assets={sortedAssets}
              designers={designers}
              onStatusChange={handleStatusChange}
              onDesignerChange={handleDesignerChange}
              onAssetClick={setSelectedAsset}
              onDeleteRequest={(asset) => setDeleteConfirm(asset)}
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
          onGameNameChange={handleGameNameChange}
          onNotesChange={handleNotesChange}
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

      {/* Multi-title search modal */}
      <Dialog open={showMultiSearchModal} onOpenChange={setShowMultiSearchModal}>
        <DialogContent className="max-w-xl">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-lg font-semibold">Search Multiple Titles</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Paste titles (one per line). Matches are shown below; missing ones are flagged.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Textarea
              value={multiSearchInput}
              onChange={(e) => setMultiSearchInput(e.target.value)}
              placeholder="One title per line"
              className="min-h-36 bg-muted/40 border-border scrollbar-soft"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div className="rounded-md border border-border bg-muted/40 p-3 space-y-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="font-medium text-foreground text-sm">Matches</span>
                  <span>{multiSearchMatches.length}</span>
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto scrollbar-soft pr-1">
                  {multiSearchMatches.length === 0 && (
                    <span className="text-xs text-muted-foreground">No matches yet</span>
                  )}
                  {multiSearchMatches.map((asset) => (
                    <span
                      key={asset.id}
                      className="inline-flex items-center gap-1 rounded-full bg-card px-2 py-1 text-xs border border-border"
                    >
                      {asset.gameName}
                    </span>
                  ))}
                </div>
              </div>

              <div className="rounded-md border border-border bg-muted/40 p-3 space-y-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="font-medium text-foreground text-sm">Not found</span>
                  <span>{multiSearchMissing.length}</span>
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto scrollbar-soft pr-1">
                  {multiSearchMissing.length === 0 && (
                    <span className="text-xs text-muted-foreground">All terms matched</span>
                  )}
                  {multiSearchMissing.map((term) => (
                    <span
                      key={term}
                      className="inline-flex items-center rounded-full border border-destructive/30 bg-destructive/5 px-2 py-1 text-[11px] text-destructive"
                    >
                      {term}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-2">
            <Button
              variant="ghost"
              onClick={() => setShowMultiSearchModal(false)}
            >
              Close
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setSearchQuery(multiSearchInput);
                setShowMultiSearchModal(false);
              }}
              disabled={multiSearchInput.trim().length === 0}
            >
              Apply to list
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk status/designer quick update */}
      <Dialog open={showBulkUpdateModal} onOpenChange={setShowBulkUpdateModal}>
        <DialogContent className="max-w-xl">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-lg font-semibold">Quick Status Update</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Paste game titles (one per line), choose a status, and optionally assign a designer. We’ll match by exact title.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span className="text-foreground font-medium">Game titles</span>
                {bulkGamesInput && (
                  <span>
                    {bulkGamesInput
                      .split("\n")
                      .map((n) => n.trim())
                      .filter((n) => n.length > 0).length} titles
                  </span>
                )}
              </div>
              <Textarea
                value={bulkGamesInput}
                onChange={(e) => setBulkGamesInput(e.target.value)}
                placeholder="One title per line"
                className="min-h-36 bg-muted/50 border-border focus-visible:ring-1 focus-visible:ring-ring scrollbar-soft"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Provider</label>
                <Select value={bulkProvider ?? undefined} onValueChange={(v) => setBulkProvider(v)}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Choose provider" />
                  </SelectTrigger>
                  <SelectContent>
                    <div className="p-2 pb-1">
                      <Input
                        value={bulkProviderFilter}
                        onChange={(e) => setBulkProviderFilter(e.target.value)}
                        placeholder="Search provider"
                        className="h-8"
                      />
                    </div>
                    {filteredBulkProviders.length === 0 && (
                      <SelectItem value="" disabled>
                        No provider found
                      </SelectItem>
                    )}
                    {filteredBulkProviders.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Status</label>
                <Select value={bulkStatus ?? undefined} onValueChange={(v) => setBulkStatus(v as AssetStatus)}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Choose status" />
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

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Designer (optional)</label>
                <Select value={bulkDesigner ?? undefined} onValueChange={(v) => setBulkDesigner(v)}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Leave unchanged" />
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
            </div>

            <div className="rounded-md border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
              Tip: Matching is scoped to the selected provider. If a title isn’t found, it stays untouched. Use the designer button only when you want to assign or clear ownership.
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-2">
            <Button
              variant="ghost"
              onClick={() => {
                setShowBulkUpdateModal(false);
                setBulkBusy(false);
              }}
              disabled={bulkBusy}
            >
              Cancel
            </Button>
            <Button
              onClick={() => handleBulkStatusUpdate(false)}
              disabled={bulkBusy || !bulkStatus || !bulkProvider}
            >
              {bulkBusy ? "Updating..." : "Update Status"}
            </Button>
            <Button
              variant="secondary"
              onClick={() => handleBulkStatusUpdate(true)}
              disabled={bulkBusy || !bulkStatus || !bulkDesigner || !bulkProvider}
            >
              {bulkBusy ? "Updating..." : "Update Status + Designer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Delete Asset?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will remove {deleteConfirm?.gameName} from the list. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteConfirm(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAsset} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Confirmation Dialog */}
      <AlertDialog open={bulkDeleteConfirm} onOpenChange={(open) => setBulkDeleteConfirm(open)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Delete selected assets?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {selectedIds.length} asset{selectedIds.length !== 1 ? "s" : ""} will be permanently removed. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setBulkDeleteConfirm(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
