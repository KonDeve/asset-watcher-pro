import { useState } from "react";
import { MissingAsset, Brand } from "@/types/asset";
import { brandOptions, providerOptions } from "@/data/mockData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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

interface AddAssetModalProps {
  open: boolean;
  onClose: () => void;
  onAdd: (asset: MissingAsset) => void;
}

export function AddAssetModal({ open, onClose, onAdd }: AddAssetModalProps) {
  const [gameName, setGameName] = useState("");
  const [provider, setProvider] = useState("");
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [notes, setNotes] = useState("");

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

    const newAsset: MissingAsset = {
      id: Date.now().toString(),
      gameName,
      provider,
      brands,
      status: "not-started",
      designer: null,
      dateFound: new Date().toISOString().split("T")[0],
      notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onAdd(newAsset);
    resetForm();
  };

  const resetForm = () => {
    setGameName("");
    setProvider("");
    setSelectedBrands([]);
    setNotes("");
  };

  const handleBrandToggle = (brandId: string) => {
    setSelectedBrands((prev) =>
      prev.includes(brandId)
        ? prev.filter((id) => id !== brandId)
        : [...prev, brandId]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Missing Asset</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Game Name */}
          <div className="space-y-2">
            <Label htmlFor="gameName">Game Name</Label>
            <Input
              id="gameName"
              value={gameName}
              onChange={(e) => setGameName(e.target.value)}
              placeholder="Enter game name"
              required
            />
          </div>

          {/* Provider */}
          <div className="space-y-2">
            <Label htmlFor="provider">Provider</Label>
            <Select value={provider} onValueChange={setProvider} required>
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
            <div className="grid grid-cols-2 gap-2">
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

          {/* Date & Time */}
          <div className="space-y-2">
            <Label>Date & Time</Label>
            <Input
              type="datetime-local"
              defaultValue={new Date().toISOString().slice(0, 16)}
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
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!gameName || !provider || selectedBrands.length === 0}
            >
              Add Asset
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
