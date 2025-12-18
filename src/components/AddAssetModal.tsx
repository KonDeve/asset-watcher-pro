import { useState, useEffect } from "react";
import { MissingAsset, Brand } from "@/types/asset";
import { useBrands, useProviders } from "@/hooks/useData";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useToast } from "@/components/ui/use-toast";
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
import { Checkbox } from "@/components/ui/checkbox";
import { AlertTriangle, ChevronsUpDown, Check } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

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
  const { toast } = useToast();
  
  const [gameNames, setGameNames] = useState("");
  const [provider, setProvider] = useState("");
  const [providerOpen, setProviderOpen] = useState(false);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [dateTime, setDateTime] = useState("");
  const [foundBy, setFoundBy] = useState("");
  
  // Duplicate detection state
  const [duplicateAsset, setDuplicateAsset] = useState<DuplicateAsset | null>(null);
  const [brandsToAdd, setBrandsToAdd] = useState<string[]>([]);
  const [multiDuplicates, setMultiDuplicates] = useState<string[]>([]);
  const [pendingNewAssets, setPendingNewAssets] = useState<MissingAsset[]>([]);
  const [pendingDuplicateUpdates, setPendingDuplicateUpdates] = useState<{
    name: string;
    existing: MissingAsset;
    newBrands: Brand[];
  }[]>([]);
  const [liveDuplicates, setLiveDuplicates] = useState<string[]>([]);
  const [liveDupPage, setLiveDupPage] = useState(1);

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

  // Live duplicate detection while typing (requires provider selection)
  useEffect(() => {
    if (!provider) {
      setLiveDuplicates([]);
      setLiveDupPage(1);
      return;
    }

    const parsedNames = gameNames
      .split("\n")
      .map((name) => name.trim())
      .filter((name) => name.length > 0);

    const dupes = new Set<string>();
    parsedNames.forEach((name) => {
      if (findDuplicate(name, provider)) {
        dupes.add(name);
      }
    });

    setLiveDuplicates(Array.from(dupes));
    setLiveDupPage(1);
  }, [gameNames, provider, existingAssets]);

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
        const existingBrandIds = new Set(duplicate.brands.map((b) => b.id));
        const newBrandIds = selectedBrands.filter((id) => !existingBrandIds.has(id));
        
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
      const duplicates: { name: string; existing: MissingAsset; newBrands: Brand[] }[] = [];

      parsedNames.forEach((name, index) => {
        const duplicate = findDuplicate(name, provider);
        if (duplicate) {
          const existingBrandIds = new Set(duplicate.brands.map((b) => b.id));
          const newBrands = brands.filter((b) => !existingBrandIds.has(b.id));
          duplicates.push({ name, existing: duplicate, newBrands });
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

      if (duplicates.length > 0) {
        const duplicateList = duplicates.map((d) => `${d.name} (${d.existing.provider})`);
        setPendingNewAssets(newAssets);
        setPendingDuplicateUpdates(duplicates);
        setMultiDuplicates(duplicateList);
        return;
      }

      // No duplicates, add all immediately
      newAssets.forEach((asset) => onAdd(asset));
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

  const closeMultiDuplicateWarning = () => {
    setPendingNewAssets([]);
    setPendingDuplicateUpdates([]);
    setMultiDuplicates([]);
  };

  const handleConfirmMultiAdd = () => {
    pendingNewAssets.forEach((asset) => onAdd(asset));
    pendingDuplicateUpdates.forEach(({ existing, newBrands }) => {
      if (newBrands.length > 0) {
        onAddBrandsToExisting(existing.id, newBrands);
      }
    });

    toast({
      title: "Assets processed",
      description: `${pendingNewAssets.length} new added. Duplicates kept in table.`,
    });

    closeMultiDuplicateWarning();
    resetForm();
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
            {provider && liveDuplicates.length > 0 && (
              <div className="rounded-md border border-amber-200 bg-amber-50 text-amber-900 p-3 space-y-2 text-sm">
                <div className="flex items-center justify-between font-medium">
                  <span>Already in table</span>
                  <span className="text-xs text-amber-900/80">{liveDuplicates.length} match{liveDuplicates.length !== 1 ? "es" : ""}</span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {liveDuplicates.slice((liveDupPage - 1) * 6, liveDupPage * 6).map((name) => (
                    <span
                      key={name}
                      className="inline-flex items-center rounded-full bg-white/70 px-3 py-1 text-amber-900 border border-amber-100"
                    >
                      {name}
                    </span>
                  ))}
                </div>

                <div className="flex items-center justify-between text-xs text-amber-900/80">
                  <span>
                    Showing {(liveDupPage - 1) * 6 + 1}–{Math.min(liveDupPage * 6, liveDuplicates.length)} of {liveDuplicates.length}
                  </span>
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 px-2"
                      disabled={liveDupPage === 1}
                      onClick={() => setLiveDupPage((p) => Math.max(1, p - 1))}
                    >
                      Prev
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 px-2"
                      disabled={liveDupPage * 6 >= liveDuplicates.length}
                      onClick={() =>
                        setLiveDupPage((p) =>
                          p * 6 >= liveDuplicates.length ? p : p + 1
                        )
                      }
                    >
                      Next
                    </Button>
                  </div>
                </div>

                <p className="text-xs text-amber-900/80">They will be skipped unless you add new brands and confirm.</p>
              </div>
            )}
            {!provider && parsedGameCount > 0 && (
              <p className="text-xs text-muted-foreground">Select a provider to check for existing titles.</p>
            )}
          </div>

          {/* Provider */}
          <div className="space-y-2">
            <Label htmlFor="provider">Provider</Label>
            <Popover open={providerOpen} onOpenChange={setProviderOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={providerOpen}
                  className="w-full justify-between h-10 text-left font-normal"
                >
                  <span className={provider ? "" : "text-muted-foreground"}>
                    {provider || "Select provider"}
                  </span>
                  <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="p-0"
                align="start"
                sideOffset={4}
                style={{ width: "var(--radix-popover-trigger-width)" }}
              >
                <Command>
                  <CommandInput placeholder="Search providers..." className="h-9" autoFocus />
                  <CommandList
                    className="max-h-64 overflow-auto scrollbar-thin scrollbar-primary"
                    onWheel={(e) => e.stopPropagation()}
                    style={{ overscrollBehavior: "contain" }}
                  >
                    <CommandEmpty>No providers found.</CommandEmpty>
                    <CommandGroup>
                      {providerOptions.map((p) => (
                        <CommandItem
                          key={p}
                          value={p}
                          onSelect={(value) => {
                            setProvider(value);
                            setProviderOpen(false);
                          }}
                          className="cursor-pointer text-sm"
                        >
                          <Check
                            className={`mr-2 h-4 w-4 ${
                              provider === p ? "opacity-100 text-primary" : "opacity-0"
                            }`}
                          />
                          {p}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
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
                const existingBrandIds = new Set(duplicateAsset.existingAsset.brands.map((b) => b.id));
                const availableBrands = brandOptions.filter((b) => !existingBrandIds.has(b.id));
                
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

      {/* Multi-entry duplicate warning */}
      <Dialog open={multiDuplicates.length > 0} onOpenChange={closeMultiDuplicateWarning}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Some games already exist
            </DialogTitle>
            <DialogDescription>
              These titles were detected as duplicates and were not added again.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="rounded-md border border-border bg-muted/40 p-3">
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                {multiDuplicates.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <p className="text-sm text-muted-foreground">
              Confirm to add the new titles and apply any new brands to the existing ones.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={closeMultiDuplicateWarning}>Cancel</Button>
              <Button onClick={handleConfirmMultiAdd}>Confirm</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
