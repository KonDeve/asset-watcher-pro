import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { mockAssets, designers, providerOptions } from "@/data/mockData";
import { StatusBadge } from "@/components/StatusBadge";
import { DesignerAvatar } from "@/components/DesignerAvatar";
import { MissingAsset, AssetStatus, statusConfig, Brand } from "@/types/asset";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Search,
  Plus,
  Filter,
  Copy,
  Share2,
  X,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { AssetDetailsPanel } from "@/components/AssetDetailsPanel";
import { AddAssetModal } from "@/components/AddAssetModal";
import { useToast } from "@/hooks/use-toast";

export default function MissingAssets() {
  const [assets, setAssets] = useState<MissingAsset[]>(mockAssets);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<AssetStatus | "all">("all");
  const [selectedAsset, setSelectedAsset] = useState<MissingAsset | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const { toast } = useToast();

  const filteredAssets = assets.filter((asset) => {
    const matchesSearch =
      asset.gameName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.provider.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || asset.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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
    setAssets((prev) =>
      prev.map((a) =>
        a.id === assetId
          ? { ...a, status: newStatus, updatedAt: new Date().toISOString() }
          : a
      )
    );
    if (selectedAsset?.id === assetId) {
      setSelectedAsset((prev) =>
        prev ? { ...prev, status: newStatus } : null
      );
    }
  };

  const handleDesignerChange = (assetId: string, designerId: string) => {
    const designer = designers.find((d) => d.id === designerId) || null;
    setAssets((prev) =>
      prev.map((a) =>
        a.id === assetId
          ? { ...a, designer, updatedAt: new Date().toISOString() }
          : a
      )
    );
    if (selectedAsset?.id === assetId) {
      setSelectedAsset((prev) => (prev ? { ...prev, designer } : null));
    }
  };

  const handleBrandReflectionToggle = (assetId: string, brandId: string, reflected: boolean) => {
    const currentUser = "Current User";
    const currentDate = new Date().toISOString().split("T")[0];
    
    setAssets((prev) =>
      prev.map((a) =>
        a.id === assetId
          ? {
              ...a,
              brands: a.brands.map((b) =>
                b.id === brandId
                  ? {
                      ...b,
                      reflected,
                      reflectedBy: reflected ? currentUser : undefined,
                      reflectedAt: reflected ? currentDate : undefined,
                    }
                  : b
              ),
              updatedAt: new Date().toISOString(),
            }
          : a
      )
    );

    if (selectedAsset?.id === assetId) {
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
                      reflectedAt: reflected ? currentDate : undefined,
                    }
                  : b
              ),
            }
          : null
      );
    }

    toast({
      title: reflected ? "Marked as reflected" : "Marked as not reflected",
      description: `Brand verification updated.`,
    });
  };

  const handleAddAsset = (newAsset: MissingAsset) => {
    setAssets((prev) => [newAsset, ...prev]);
    setShowAddModal(false);
    toast({
      title: "Asset added",
      description: `${newAsset.gameName} has been added to the list.`,
    });
  };

  return (
    <AppLayout>
      <div className="flex h-full">
        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Header */}
          <div className="p-4 lg:p-6 border-b border-border bg-card shrink-0">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
              <div>
                <h1 className="text-xl lg:text-2xl font-semibold text-foreground">
                  Missing Assets
                </h1>
                <p className="text-sm text-muted-foreground">
                  {filteredAssets.length} of {assets.length} assets
                </p>
              </div>
              <Button onClick={() => setShowAddModal(true)} size="sm">
                <Plus className="w-4 h-4 mr-1" />
                Add Asset
              </Button>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search games or providers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9"
                />
              </div>
              <Select
                value={statusFilter}
                onValueChange={(v) => setStatusFilter(v as AssetStatus | "all")}
              >
                <SelectTrigger className="w-full sm:w-44 h-9">
                  <Filter className="w-4 h-4 mr-2" />
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
            </div>
          </div>

          {/* Table */}
          <div className="flex-1 overflow-auto">
            <table className="w-full">
              <thead className="sticky top-0 z-10 bg-muted/80 backdrop-blur-sm">
                <tr className="border-b border-border">
                  <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">
                    Game Name
                  </th>
                  <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3 hidden md:table-cell">
                    Provider
                  </th>
                  <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">
                    Brands & Verification
                  </th>
                  <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">
                    Status
                  </th>
                  <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3 hidden lg:table-cell">
                    Designer
                  </th>
                  <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3 hidden xl:table-cell">
                    Date Found
                  </th>
                  <th className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredAssets.map((asset) => (
                  <tr
                    key={asset.id}
                    onClick={() => setSelectedAsset(asset)}
                    className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                      selectedAsset?.id === asset.id ? "bg-primary/5" : ""
                    }`}
                  >
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-foreground text-sm">
                          {asset.gameName}
                        </p>
                        <p className="text-xs text-muted-foreground md:hidden">
                          {asset.provider}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground hidden md:table-cell">
                      {asset.provider}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1.5">
                        {asset.brands.slice(0, 3).map((brand) => (
                          <div
                            key={brand.id}
                            className="flex items-center gap-2"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <span
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: brand.color }}
                            />
                            <span className="text-xs text-foreground truncate max-w-[80px]">
                              {brand.name}
                            </span>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="flex items-center">
                                  <Switch
                                    checked={brand.reflected}
                                    onCheckedChange={(checked) =>
                                      handleBrandReflectionToggle(asset.id, brand.id, checked)
                                    }
                                    className="scale-75 data-[state=checked]:bg-success"
                                  />
                                </div>
                              </TooltipTrigger>
                              <TooltipContent side="right">
                                <div className="text-xs">
                                  <p className="font-medium">
                                    {brand.reflected ? "Verified as reflected" : "Not verified"}
                                  </p>
                                  {brand.reflected && brand.reflectedBy && (
                                    <p className="text-muted-foreground">
                                      by {brand.reflectedBy} on {brand.reflectedAt}
                                    </p>
                                  )}
                                </div>
                              </TooltipContent>
                            </Tooltip>
                            {brand.reflected ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-success shrink-0" />
                            ) : (
                              <XCircle className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                            )}
                          </div>
                        ))}
                        {asset.brands.length > 3 && (
                          <span className="text-xs text-muted-foreground">
                            +{asset.brands.length - 3} more
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <Select
                        value={asset.status}
                        onValueChange={(v) =>
                          handleStatusChange(asset.id, v as AssetStatus)
                        }
                      >
                        <SelectTrigger className="w-28 lg:w-32 h-7 border-0 bg-transparent p-0 focus:ring-0">
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
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell" onClick={(e) => e.stopPropagation()}>
                      <Select
                        value={asset.designer?.id || "unassigned"}
                        onValueChange={(v) => handleDesignerChange(asset.id, v)}
                      >
                        <SelectTrigger className="w-32 h-7 border-0 bg-transparent p-0 focus:ring-0">
                          <DesignerAvatar designer={asset.designer} />
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
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs hidden xl:table-cell">
                      {new Date(asset.dateFound).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyDoc(asset);
                          }}
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleShare(asset);
                          }}
                        >
                          <Share2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredAssets.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-muted-foreground text-sm">No assets found</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Try adjusting your search or filters
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Details Panel */}
        {selectedAsset && (
          <AssetDetailsPanel
            asset={selectedAsset}
            onClose={() => setSelectedAsset(null)}
            onStatusChange={handleStatusChange}
            onDesignerChange={handleDesignerChange}
            onBrandReflectionToggle={handleBrandReflectionToggle}
          />
        )}
      </div>

      {/* Add Modal */}
      <AddAssetModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddAsset}
      />
    </AppLayout>
  );
}