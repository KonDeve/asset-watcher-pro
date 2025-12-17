import { useState, useEffect } from "react";
import { MissingAsset, Brand } from "@/types/asset";
import { useBrands, useProviders } from "@/hooks/useData";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertTriangle } from "lucide-react";

interface DuplicateAsset {
  existingAsset: MissingAsset;
  newGameName: string;
}

interface AddAssetModalProps {
  open: boolean;
  onClose: () => void;
  onAdd: (asset: MissingAsset) => void;
  onAddBrandsToExisting: (assetId: string, brands: Brand[]) => void;
  existingAssets: MissingAsset[];
}

export function AddAssetModal({ open, onClose, onAdd, onAddBrandsToExisting, existingAssets }: AddAssetModalProps) {
  const { brands: brandOptions } = useBrands();
  const { providers: providerOptions } = useProviders();
  const { profile } = useCurrentUser();
  
  const [gameNames, setGameNames] = useState("");
  const [provider, setProvider] = useState("");
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [dateTime, setDateTime] = useState("");
  const [foundBy, setFoundBy] = useState("");
  
  // Duplicate detection state
  const [duplicateAsset, setDuplicateAsset] = useState<DuplicateAsset | null>(null);
  const [brandsToAdd, setBrandsToAdd] = useState<string[]>([]);

  // Get local datetime string in the format required by datetime-local input
  const getLocalDateTime = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // Automatically set current date/time from device when modal opens
  useEffect(() => {
    if (open) {
      setDateTime(getLocalDateTime());
      const defaultFoundBy = profile?.name || profile?.email || "Unknown";
      setFoundBy(defaultFoundBy);
    }
  }, [open, profile?.name, profile?.email]);

  // Helper to normalize game names for comparison
  const normalizeGameName = (name: string) => {
    return name.toLowerCase().trim().replace(/\s+/g, " ");
  };

  // Find duplicate asset
  const findDuplicate = (gameName: string, providerName: string): MissingAsset | null => {
    const normalizedName = normalizeGameName(gameName);
    return existingAssets.find(
      (asset) =>
        normalizeGameName(asset.gameName) === normalizedName &&
        asset.provider.toLowerCase() === providerName.toLowerCase()
    ) || null;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const brands: Brand[] = selectedBrands.map((brandId) => {
      const brandOption = brandOptions.find((b) => b.id === brandId)!;
      return {
        id: brandOption.id,
        name: brandOption.name,
        color: brandOption.color,
        reflected: false,
      };
    });

    // Parse game names (one per line)
    const parsedNames = gameNames
      .split("\n")
      .map((name) => name.trim())
      .filter((name) => name.length > 0);

    // Check for duplicates (only for single game entry)
    if (parsedNames.length === 1) {
      const duplicate = findDuplicate(parsedNames[0], provider);
      if (duplicate) {
        // Get brands that aren't already on the existing asset
        const existingBrandIds = duplicate.brands.map((b) => b.id.split("-")[0]);
        const newBrandIds = selectedBrands.filter((id) => !existingBrandIds.includes(id));
        
        if (newBrandIds.length === 0) {
          // All selected brands already exist on this asset
          setDuplicateAsset({ existingAsset: duplicate, newGameName: parsedNames[0] });
          setBrandsToAdd([]);
        } else {
          setDuplicateAsset({ existingAsset: duplicate, newGameName: parsedNames[0] });
          setBrandsToAdd(newBrandIds);
        }
        return;
      }
    }

    // For multiple games, check each one
    if (parsedNames.length > 1) {
      const newAssets: MissingAsset[] = [];
      const duplicates: { name: string; existing: MissingAsset }[] = [];

      parsedNames.forEach((name, index) => {
        const duplicate = findDuplicate(name, provider);
        if (duplicate) {
          duplicates.push({ name, existing: duplicate });
        } else {
          const newAsset: MissingAsset = {
            id: `${Date.now()}-${index}`,
            gameName: name,
            provider,
            brands,
            status: "not-started",
            designer: null,
            foundBy: foundBy || "Unknown",
            dateFound: dateTime.split("T")[0],
            notes,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          newAssets.push(newAsset);
        }
      });

      // Add all non-duplicate assets
      newAssets.forEach((asset) => onAdd(asset));

      // For duplicates, add new brands to existing assets
      duplicates.forEach(({ existing }) => {
        const existingBrandIds = existing.brands.map((b) => b.id.split("-")[0]);
        const newBrands = brands.filter((b) => !existingBrandIds.includes(b.id));
        if (newBrands.length > 0) {
          onAddBrandsToExisting(existing.id, newBrands);
        }
      });

      resetForm();
      return;
    }

    // No duplicates, add normally
    parsedNames.forEach((name, index) => {
      const newAsset: MissingAsset = {
        id: `${Date.now()}-${index}`,
        gameName: name,
        provider,
        brands,
        status: "not-started",
        designer: null,
        foundBy: foundBy || "Unknown",
        dateFound: dateTime.split("T")[0],
        notes,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      onAdd(newAsset);
    });

    resetForm();
  };

  // Handle adding brands to existing asset from duplicate modal
  const handleAddBrandsToDuplicate = () => {
    if (!duplicateAsset) return;

    const brandsToAddList: Brand[] = brandsToAdd.map((brandId) => {
      const brandOption = brandOptions.find((b) => b.id === brandId)!;
      return {
        id: brandOption.id,
        name: brandOption.name,
        color: brandOption.color,
        reflected: false,
      };
    });

    onAddBrandsToExisting(duplicateAsset.existingAsset.id, brandsToAddList);
    setDuplicateAsset(null);
    setBrandsToAdd([]);
    resetForm();
  };

  const handleDuplicateBrandToggle = (brandId: string) => {
    setBrandsToAdd((prev) =>
      prev.includes(brandId)
        ? prev.filter((id) => id !== brandId)
        : [...prev, brandId]
    );
  };

  const closeDuplicateModal = () => {
    setDuplicateAsset(null);
    setBrandsToAdd([]);
  };

  const resetForm = () => {
    setGameNames("");
    setProvider("");
    setSelectedBrands([]);
    setNotes("");
    setDateTime(new Date().toISOString().slice(0, 16));
    const defaultFoundBy = profile?.name || profile?.email || "Unknown";
    setFoundBy(defaultFoundBy);
  };

  const handleBrandToggle = (brandId: string) => {
    setSelectedBrands((prev) =>
      prev.includes(brandId)
        ? prev.filter((id) => id !== brandId)
        : [...prev, brandId]
    );
  };

  const parsedGameCount = gameNames
    .split("\n")
    .map((name) => name.trim())
    .filter((name) => name.length > 0).length;

  const isSubmitDisabled = parsedGameCount === 0 || !provider || selectedBrands.length === 0 || !foundBy;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Add Missing Asset</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 overflow-auto scrollbar-thin space-y-4 pr-1">
          {/* Game Names */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="gameNames">Game Name(s)</Label>
              {parsedGameCount > 0 && (
                <span className="text-xs text-muted-foreground">
                  {parsedGameCount} game{parsedGameCount !== 1 ? "s" : ""}
                </span>
              )}
            </div>
            <Textarea
              id="gameNames"
              value={gameNames}
              onChange={(e) => setGameNames(e.target.value)}
              placeholder="Enter game name(s), one per line for multiple games"
              className="min-h-24 text-sm"
            />
          </div>

          {/* Provider */}
          <div className="space-y-2">
            <Label htmlFor="provider">Provider</Label>
            <Select value={provider} onValueChange={setProvider}>
              <SelectTrigger>
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
            <Label>Brands / Websites</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {brandOptions.map((brand) => (
                <div key={brand.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={brand.id}
                    checked={selectedBrands.includes(brand.id)}
                    onCheckedChange={() => handleBrandToggle(brand.id)}
                  />
                  <label
                    htmlFor={brand.id}
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
            </div>
          </div>

          {/* Found By (auto) */}
          <div className="space-y-2">
            <Label htmlFor="foundBy">Found By</Label>
            <Input
              id="foundBy"
              value={foundBy || "Unknown"}
              readOnly
              aria-readonly
            />
          </div>

          {/* Date & Time */}
          <div className="space-y-2">
            <Label htmlFor="dateTime">Date & Time</Label>
            <Input
              id="dateTime"
              type="datetime-local"
              value={dateTime}
              onChange={(e) => setDateTime(e.target.value)}
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any additional notes..."
              className="min-h-20"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2 pb-1">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitDisabled}>
              {parsedGameCount > 1
                ? `Add ${parsedGameCount} Assets`
                : "Add Asset"}
            </Button>
          </div>
        </form>
      </DialogContent>

      {/* Duplicate Asset Modal */}
      <Dialog open={!!duplicateAsset} onOpenChange={closeDuplicateModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Asset Already Exists
            </DialogTitle>
            <DialogDescription>
              An asset with this name and provider already exists in the table.
            </DialogDescription>
          </DialogHeader>

          {duplicateAsset && (
            <div className="space-y-4">
              {/* Existing Asset Info */}
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Game Name</span>
                  <span className="text-sm text-muted-foreground">{duplicateAsset.existingAsset.gameName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Provider</span>
                  <span className="text-sm text-muted-foreground">{duplicateAsset.existingAsset.provider}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Current Brands</span>
                  <div className="flex gap-1 flex-wrap justify-end">
                    {duplicateAsset.existingAsset.brands.map((brand) => (
                      <span
                        key={brand.id}
                        className="inline-flex items-center gap-1 text-xs bg-background px-2 py-0.5 rounded"
                      >
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: brand.color }}
                        />
                        {brand.name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Add Brands Section */}
              {(() => {
                const existingBrandIds = duplicateAsset.existingAsset.brands.map((b) => b.id.split("-")[0]);
                const availableBrands = brandOptions.filter((b) => !existingBrandIds.includes(b.id));
                
                if (availableBrands.length === 0) {
                  return (
                    <div className="text-center py-4">
                      <p className="text-sm text-muted-foreground">
                        All selected brands are already associated with this asset.
                      </p>
                    </div>
                  );
                }

                return (
                  <div className="space-y-2">
                    <Label>Add Brand(s) to Existing Asset</Label>
                    <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-1">
                      {availableBrands.map((brand) => (
                        <div key={brand.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`dup-${brand.id}`}
                            checked={brandsToAdd.includes(brand.id)}
                            onCheckedChange={() => handleDuplicateBrandToggle(brand.id)}
                          />
                          <label
                            htmlFor={`dup-${brand.id}`}
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
                    </div>
                  </div>
                );
              })()}

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={closeDuplicateModal}>
                  Cancel
                </Button>
                <Button
                  onClick={handleAddBrandsToDuplicate}
                  disabled={brandsToAdd.length === 0}
                >
                  Add {brandsToAdd.length} Brand{brandsToAdd.length !== 1 ? "s" : ""}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
