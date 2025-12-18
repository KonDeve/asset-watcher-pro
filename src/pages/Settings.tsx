import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useTheme } from "@/components/ThemeProvider";
import { PageLoader } from "@/components/PageLoader";
import { useMinimumLoader } from "@/hooks/use-minimum-loader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Moon,
  Sun,
  Palette,
  Building2,
  Globe,
  Layers,
  Plus,
  Trash2,
  Edit2,
  X,
  Loader2,
} from "lucide-react";
import { useAssets, useBrands, useProviders } from "@/hooks/useData";
import { useToast } from "@/hooks/use-toast";

interface Brand {
  id: string;
  name: string;
  color: string;
}

interface Provider {
  id: string;
  name: string;
}

interface Aggregator {
  id: string;
  name: string;
  color: string;
}

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const {
    brands: brandData,
    loading: brandsLoading,
    addBrand,
    updateBrand,
    deleteBrand,
  } = useBrands();
  const {
    providers: providerData,
    loading: providersLoading,
    addProvider,
    updateProvider,
    deleteProvider,
  } = useProviders();
  const { assets } = useAssets();

  const [brands, setBrands] = useState<Brand[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: "brand" | "provider";
    id: string;
    name: string;
    usageCount: number;
  } | null>(null);

  // Initialize brands from data hook once loaded
  useEffect(() => {
    if (!brandsLoading) {
      setBrands(brandData);
    }
  }, [brandData, brandsLoading]);

  // Initialize providers from data hook once loaded
  useEffect(() => {
    if (!providersLoading) {
      setProviders(providerData.map((name, idx) => ({ id: String(idx + 1), name })));
    }
  }, [providerData, providersLoading]);

  const [aggregators, setAggregators] = useState<Aggregator[]>([
    { id: "1", name: "SoftSwiss", color: "#3b82f6" },
    { id: "2", name: "Slotegrator", color: "#10b981" },
    { id: "3", name: "EveryMatrix", color: "#f59e0b" },
  ]);

  const [providerSearch, setProviderSearch] = useState("");

  // Brand Modal State
  const [brandModalOpen, setBrandModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [brandForm, setBrandForm] = useState({ name: "", color: "#3b82f6" });
  const [isSavingBrand, setIsSavingBrand] = useState(false);

  // Provider Modal State
  const [providerModalOpen, setProviderModalOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState<Provider | null>(null);
  const [providerForm, setProviderForm] = useState({ name: "" });
  const [isSavingProvider, setIsSavingProvider] = useState(false);

  // Brand Modal Handlers
  const openAddBrandModal = () => {
    setEditingBrand(null);
    setBrandForm({ name: "", color: "#3b82f6" });
    setBrandModalOpen(true);
  };

  const openEditBrandModal = (brand: Brand) => {
    setEditingBrand(brand);
    setBrandForm({ name: brand.name, color: brand.color });
    setBrandModalOpen(true);
  };

  const handleSaveBrand = async () => {
    if (!brandForm.name.trim()) return;
    setIsSavingBrand(true);
    try {
      if (editingBrand) {
        const updated = await updateBrand(editingBrand.id, { name: brandForm.name, color: brandForm.color });
        if (!updated) throw new Error("Failed to update brand");
        toast({ title: "Brand updated", description: `${brandForm.name} has been updated.` });
      } else {
        const created = await addBrand({ name: brandForm.name, color: brandForm.color });
        if (!created) throw new Error("Failed to add brand");
        toast({ title: "Brand added", description: `${brandForm.name} has been added.` });
      }
      setBrandModalOpen(false);
    } catch (error) {
      console.error(error);
      toast({ title: "Save failed", description: "Could not save brand.", variant: "destructive" });
    } finally {
      setIsSavingBrand(false);
    }
  };

  const handleRequestDeleteBrand = (brand: Brand) => {
    const usageCount = assets.filter((asset) => asset.brands.some((b) => b.id === brand.id)).length;
    setDeleteConfirm({ type: "brand", id: brand.id, name: brand.name, usageCount });
  };

  // Provider Modal Handlers
  const openAddProviderModal = () => {
    setEditingProvider(null);
    setProviderForm({ name: "" });
    setProviderModalOpen(true);
  };

  const openEditProviderModal = (provider: Provider) => {
    setEditingProvider(provider);
    setProviderForm({ name: provider.name });
    setProviderModalOpen(true);
  };

  const handleSaveProvider = async () => {
    if (!providerForm.name.trim()) return;
    setIsSavingProvider(true);
    try {
      if (editingProvider) {
        const updated = await updateProvider(editingProvider.name, providerForm.name);
        if (!updated) throw new Error("Failed to update provider");
        toast({ title: "Provider updated", description: `${providerForm.name} has been updated.` });
      } else {
        const created = await addProvider(providerForm.name);
        if (!created) throw new Error("Failed to add provider");
        toast({ title: "Provider added", description: `${providerForm.name} has been added.` });
      }
      setProviderModalOpen(false);
    } catch (error) {
      console.error(error);
      toast({ title: "Save failed", description: "Could not save provider.", variant: "destructive" });
    } finally {
      setIsSavingProvider(false);
    }
  };

  const handleRequestDeleteProvider = (provider: Provider) => {
    const usageCount = assets.filter((asset) => asset.provider === provider.name).length;
    setDeleteConfirm({ type: "provider", id: provider.id, name: provider.name, usageCount });
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirm) return;
    const { type, id, name, usageCount } = deleteConfirm;
    const isBrand = type === "brand";
    const success = isBrand
      ? await deleteBrand(id)
      : await deleteProvider(name);

    if (success) {
      toast({
        title: `${isBrand ? "Brand" : "Provider"} deleted`,
        description:
          usageCount > 0
            ? `${usageCount} asset${usageCount === 1 ? "" : "s"} were linked and may need updates.`
            : `${name} has been removed.`,
      });
    } else {
      toast({ title: "Delete failed", description: `Could not delete ${name}.`, variant: "destructive" });
    }

    setDeleteConfirm(null);
  };

  const handleSave = () => {
    toast({
      title: "Settings saved",
      description: "Your preferences have been updated.",
    });
  };

  const deleteSummary = deleteConfirm
    ? deleteConfirm.usageCount > 0
      ? `${deleteConfirm.usageCount} asset${deleteConfirm.usageCount === 1 ? "" : "s"} currently reference this ${deleteConfirm.type}. Removing it will clear those references.`
      : `No assets currently reference this ${deleteConfirm.type}.`
    : "";

  const filteredProviders = providers.filter((provider) =>
    provider.name.toLowerCase().includes(providerSearch.toLowerCase())
  );

  const showLoader = useMinimumLoader(brandsLoading || providersLoading, 1500);

  if (showLoader) {
    return (
      <AppLayout>
        <PageLoader message="Loading settings..." />
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-4 lg:p-6 h-full overflow-auto scrollbar-thin">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-xl lg:text-2xl font-semibold text-foreground">Settings</h1>
          <p className="text-sm text-muted-foreground">
            Manage your application preferences and data
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 max-w-6xl">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Appearance */}
            <div className="bg-card border border-border rounded-lg p-4 lg:p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Palette className="w-4 h-4 text-primary" />
                </div>
                <h2 className="font-semibold text-foreground">Appearance</h2>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">Dark Mode</p>
                    <p className="text-xs text-muted-foreground">
                      Toggle between light and dark themes
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Sun className="w-4 h-4 text-muted-foreground" />
                    <Switch
                      checked={theme === "dark"}
                      onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
                    />
                    <Moon className="w-4 h-4 text-muted-foreground" />
                  </div>
                </div>
              </div>
            </div>

            {/* Brands */}
            <div className="bg-card border border-border rounded-lg p-4 lg:p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Globe className="w-4 h-4 text-primary" />
                  </div>
                  <h2 className="font-semibold text-foreground">Brands / Websites</h2>
                </div>
                <Button variant="outline" size="sm" onClick={openAddBrandModal}>
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Add
                </Button>
              </div>

              <div className="space-y-2 max-h-64 overflow-auto scrollbar-thin">
                {brands.map((brand) => (
                  <div
                    key={brand.id}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30 border border-border group"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full ring-2 ring-white dark:ring-card shadow-sm"
                        style={{ backgroundColor: brand.color }}
                      />
                      <span className="text-sm font-medium text-foreground">{brand.name}</span>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => openEditBrandModal(brand)}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => handleRequestDeleteBrand(brand)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
                {brands.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No brands added yet
                  </p>
                )}
              </div>
            </div>

            {/* Aggregators */}
            <div className="bg-card border border-border rounded-lg p-4 lg:p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Layers className="w-4 h-4 text-primary" />
                  </div>
                  <h2 className="font-semibold text-foreground">Aggregators</h2>
                </div>
                <Button variant="outline" size="sm">
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Add
                </Button>
              </div>

              <div className="space-y-2">
                {aggregators.map((aggregator) => (
                  <div
                    key={aggregator.id}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30 border border-border group"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full ring-2 ring-white dark:ring-card shadow-sm"
                        style={{ backgroundColor: aggregator.color }}
                      />
                      <span className="text-sm font-medium text-foreground">{aggregator.name}</span>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive">
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                Aggregators are platforms that provide multiple game providers.
              </p>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Providers */}
            <div className="bg-card border border-border rounded-lg p-4 lg:p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Building2 className="w-4 h-4 text-primary" />
                  </div>
                  <h2 className="font-semibold text-foreground">Game Providers</h2>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    value={providerSearch}
                    onChange={(e) => setProviderSearch(e.target.value)}
                    placeholder="Search providers..."
                    className="h-9 w-48"
                  />
                  <Button variant="outline" size="sm" onClick={openAddProviderModal}>
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    Add
                  </Button>
                </div>
              </div>

              <div className="space-y-2 max-h-96 overflow-auto scrollbar-thin scrollbar-primary">
                {filteredProviders.map((provider) => (
                  <div
                    key={provider.id}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30 border border-border group"
                  >
                    <span className="text-sm font-medium text-foreground">{provider.name}</span>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => openEditProviderModal(provider)}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => handleRequestDeleteProvider(provider)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
                {filteredProviders.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    {providers.length === 0
                      ? "No providers added yet"
                      : "No providers match your search"}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end mt-6 pt-4 border-t border-border max-w-6xl">
          <Button onClick={handleSave}>Save Changes</Button>
        </div>
      </div>

      {/* Brand Modal */}
      <Dialog open={brandModalOpen} onOpenChange={setBrandModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingBrand ? "Edit Brand" : "Add New Brand"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="brandName">Brand Name</Label>
              <Input
                id="brandName"
                placeholder="Enter brand name"
                value={brandForm.name}
                onChange={(e) => setBrandForm({ ...brandForm, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="brandColor">Brand Color</Label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  id="brandColor"
                  value={brandForm.color}
                  onChange={(e) => setBrandForm({ ...brandForm, color: e.target.value })}
                  className="w-10 h-10 rounded-lg border border-border cursor-pointer"
                />
                <Input
                  value={brandForm.color}
                  onChange={(e) => setBrandForm({ ...brandForm, color: e.target.value })}
                  className="flex-1 font-mono uppercase"
                  maxLength={7}
                />
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <span
                className="w-4 h-4 rounded-full ring-2 ring-white dark:ring-card shadow-sm"
                style={{ backgroundColor: brandForm.color }}
              />
              <span className="text-sm font-medium">
                {brandForm.name || "Brand Preview"}
              </span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBrandModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveBrand} disabled={isSavingBrand || !brandForm.name.trim()}>
              {isSavingBrand ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : editingBrand ? (
                "Update Brand"
              ) : (
                "Add Brand"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Provider Modal */}
      <Dialog open={providerModalOpen} onOpenChange={setProviderModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingProvider ? "Edit Provider" : "Add New Provider"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="providerName">Provider Name</Label>
              <Input
                id="providerName"
                placeholder="Enter provider name"
                value={providerForm.name}
                onChange={(e) => setProviderForm({ ...providerForm, name: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProviderModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveProvider} disabled={isSavingProvider || !providerForm.name.trim()}>
              {isSavingProvider ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : editingProvider ? (
                "Update Provider"
              ) : (
                "Add Provider"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Remove {deleteConfirm?.type === "brand" ? "brand" : "provider"}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              You are about to remove "{deleteConfirm?.name}". {deleteSummary}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteConfirm(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}