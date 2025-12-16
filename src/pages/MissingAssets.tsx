import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { mockAssets, designers, providerOptions } from "@/data/mockData";
import { StatusBadge } from "@/components/StatusBadge";
import { DesignerAvatar } from "@/components/DesignerAvatar";
import { BrandTag } from "@/components/BrandTag";
import { MissingAsset, AssetStatus, statusConfig } from "@/types/asset";
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
  Filter,
  Copy,
  Share2,
  ChevronDown,
  X,
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
    // In a real app, this would generate a shareable link
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
      <div className="flex h-screen">
        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-border bg-card">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-xl font-semibold text-foreground">
                  Missing Assets
                </h1>
                <p className="text-sm text-muted-foreground">
                  {filteredAssets.length} assets found
                </p>
              </div>
              <Button onClick={() => setShowAddModal(true)} size="sm">
                <Plus className="w-4 h-4 mr-1" />
                Add Asset
              </Button>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-3">
              <div className="relative flex-1 max-w-xs">
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
                <SelectTrigger className="w-40 h-9">
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
          <div className="flex-1 overflow-auto scrollbar-thin">
            <table className="table-compact">
              <thead className="sticky top-0 z-10">
                <tr>
                  <th>Game Name</th>
                  <th>Provider</th>
                  <th>Brands</th>
                  <th>Status</th>
                  <th>Designer</th>
                  <th>Date Found</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAssets.map((asset) => (
                  <tr
                    key={asset.id}
                    onClick={() => setSelectedAsset(asset)}
                    className={
                      selectedAsset?.id === asset.id
                        ? "bg-primary/5"
                        : ""
                    }
                  >
                    <td className="font-medium text-foreground">
                      {asset.gameName}
                    </td>
                    <td className="text-muted-foreground">{asset.provider}</td>
                    <td>
                      <div className="flex flex-wrap gap-1">
                        {asset.brands.slice(0, 2).map((brand) => (
                          <BrandTag key={brand.id} brand={brand} />
                        ))}
                        {asset.brands.length > 2 && (
                          <span className="text-xs text-muted-foreground">
                            +{asset.brands.length - 2}
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <Select
                        value={asset.status}
                        onValueChange={(v) =>
                          handleStatusChange(asset.id, v as AssetStatus)
                        }
                      >
                        <SelectTrigger className="w-32 h-7 border-0 bg-transparent p-0">
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
                    <td>
                      <Select
                        value={asset.designer?.id || "unassigned"}
                        onValueChange={(v) => handleDesignerChange(asset.id, v)}
                      >
                        <SelectTrigger className="w-32 h-7 border-0 bg-transparent p-0">
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
                    <td className="text-muted-foreground text-xs">
                      {new Date(asset.dateFound).toLocaleDateString()}
                    </td>
                    <td>
                      <div className="flex items-center gap-1">
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
          </div>
        </div>

        {/* Details Panel */}
        {selectedAsset && (
          <AssetDetailsPanel
            asset={selectedAsset}
            onClose={() => setSelectedAsset(null)}
            onStatusChange={handleStatusChange}
            onDesignerChange={handleDesignerChange}
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
