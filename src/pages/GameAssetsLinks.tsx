import { useMemo, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { useToast } from "@/hooks/use-toast";
import { useGameAssetLinks } from "@/hooks/useData";
import { GameAssetLink } from "@/types/gameAsset";
import { Loader2, MinusCircle, Pencil, Plus, Search, Trash2, Pin } from "lucide-react";

export default function GameAssetsLinks() {
  const { links, loading, error, addLink, updateLink, deleteLink } = useGameAssetLinks();
  const { toast } = useToast();
  const [formRows, setFormRows] = useState([
    { gameName: "", assetUrl: "", username: "", password: "" },
  ]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<GameAssetLink | null>(null);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [pinnedIds, setPinnedIds] = useState<string[]>([]);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; gameName: string } | null>(null);

  const onChange = (index: number, key: keyof typeof formRows[number], value: string) => {
    setFormRows((prev) => prev.map((row, i) => (i === index ? { ...row, [key]: value } : row)));
  };

  const addRow = () => {
    setFormRows((prev) => [...prev, { gameName: "", assetUrl: "", username: "", password: "" }]);
  };

  const duplicateRow = (index: number) => {
    setFormRows((prev) => {
      const source = prev[index];
      const clone = {
        gameName: source.gameName,
        assetUrl: "",
        username: "",
        password: "",
      };
      return [...prev.slice(0, index + 1), clone, ...prev.slice(index + 1)];
    });
  };

  const removeRow = (index: number) => {
    setFormRows((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== index)));
  };

  const filteredLinks = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return links;
    return links.filter((link) =>
      [link.gameName, link.assetUrl, link.username, link.password].some((field) =>
        (field || "").toLowerCase().includes(term)
      )
    );
  }, [links, search]);

  const groupedLinks = useMemo(() => {
    const map = new Map<string, { gameName: string; assetUrls: string[]; username: string; password: string; ids: string[] }>();
    filteredLinks.forEach((link) => {
      const key = link.gameName;
      const existing = map.get(key);
      if (existing) {
        existing.assetUrls.push(link.assetUrl);
        existing.ids.push(link.id);
      } else {
        map.set(key, {
          gameName: link.gameName,
          assetUrls: [link.assetUrl],
          username: link.username,
          password: link.password,
          ids: [link.id],
        });
      }
    });
    const result = Array.from(map.values());
    if (!pinnedIds.length) return result;
    const pinnedSet = new Set(pinnedIds);
    return result.sort((a, b) => {
      const aPinned = a.ids.some((id) => pinnedSet.has(id));
      const bPinned = b.ids.some((id) => pinnedSet.has(id));
      if (aPinned === bPinned) return a.gameName.localeCompare(b.gameName);
      return aPinned ? -1 : 1;
    });
  }, [filteredLinks, pinnedIds]);

  const openAddModal = () => {
    setEditingLink(null);
    setFormRows([{ gameName: "", assetUrl: "", username: "", password: "" }]);
    setDialogOpen(true);
  };

  const openEditModal = (link: GameAssetLink) => {
    setEditingLink(link);
    setFormRows([
      {
        gameName: link.gameName,
        assetUrl: link.assetUrl,
        username: link.username,
        password: link.password,
      },
    ]);
    setDialogOpen(true);
  };

  const handleDelete = (id: string, gameName: string) => {
    setDeleteConfirm({ id, gameName });
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    const success = await deleteLink(deleteConfirm.id);
    if (success) {
      toast({ title: "Link removed", description: `${deleteConfirm.gameName} has been removed.` });
    } else {
      toast({ title: "Delete failed", description: "Could not remove link.", variant: "destructive" });
    }
    setDeleteConfirm(null);
  };

  const togglePin = (id: string) => {
    setPinnedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [id, ...prev]
    );
  };

  const handleSave = async () => {
    const trimmedRows = formRows.map((row) => ({
      gameName: row.gameName.trim(),
      assetUrl: row.assetUrl.trim(),
      username: row.username.trim(),
      password: row.password.trim(),
    }));

    // Expand rows: each row can carry its own game name; a single row can add multiple links (space-separated)
    const expandedPayloads = trimmedRows.flatMap((row, index) => {
      if (!row.gameName) {
        return [{ error: `Row ${index + 1}: game name required` }];
      }

      const links = row.assetUrl.split(/\s+/).filter(Boolean);
      if (links.length === 0) {
        return [{ error: `Row ${index + 1}: add at least one asset link` }];
      }

      return links.map((link) => ({
        gameName: row.gameName,
        assetUrl: link,
        username: row.username,
        password: row.password,
      }));
    });

    const errorEntry = expandedPayloads.find((row: any) => (row as any).error);
    if (errorEntry) {
      toast({
        title: "Missing info",
        description: (errorEntry as { error: string }).error,
        variant: "destructive",
      });
      return;
    }

    if (expandedPayloads.length === 0) {
      toast({
        title: "Missing info",
        description: "Add at least one game and asset link.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);

    if (editingLink) {
      // For edit, only take the first link input
      const firstPayload = expandedPayloads[0];
      const saved = await updateLink(editingLink.id, firstPayload);
      setSaving(false);
      if (saved) {
        toast({ title: "Link updated", description: saved.gameName });
        setDialogOpen(false);
        setFormRows([{ gameName: "", assetUrl: "", username: "", password: "" }]);
        setEditingLink(null);
      } else {
        toast({ title: "Update failed", description: "Could not update link.", variant: "destructive" });
      }
      return;
    }

    let successCount = 0;
    for (const payload of expandedPayloads) {
      const saved = await addLink(payload);
      if (saved) successCount += 1;
    }

    setSaving(false);

    if (successCount === expandedPayloads.length) {
      toast({ title: "Links added", description: `${successCount} link(s) added.` });
      setDialogOpen(false);
      setFormRows([{ gameName: "", assetUrl: "", username: "", password: "" }]);
    } else if (successCount > 0) {
      toast({
        title: "Partial success",
        description: `${successCount} of ${expandedPayloads.length} links added.`,
        variant: "destructive",
      });
    } else {
      toast({ title: "Add failed", description: "No links were created.", variant: "destructive" });
    }
  };

  return (
    <AppLayout>
      <div className="p-4 lg:p-6 space-y-6 h-full overflow-auto scrollbar-thin">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Game Assets Links</h1>
            <p className="text-sm text-muted-foreground mt-1.5">
              Quick access to asset links with credentials (shown in plain text).
            </p>
          </div>
          <Badge variant="secondary" className="w-fit">Credentials Visible</Badge>
        </div>

        <Card className="p-4 lg:p-5 border border-border bg-card/50 backdrop-blur-sm shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex w-full items-center gap-2 lg:max-w-xl">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-9 h-10 bg-background"
                  placeholder="Search by game, URL, username, or password"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
            <Button onClick={openAddModal} className="w-full lg:w-auto h-10">
              <Plus className="w-4 h-4 mr-2" /> Add Link
            </Button>
          </div>
        </Card>

        <Card className="overflow-hidden border border-border shadow-sm">
          <div className="overflow-auto">
            <table className="min-w-full border-collapse">
              <thead className="bg-muted/80 backdrop-blur-sm border-b border-border sticky top-0 z-10">
                <tr>
                  <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-6 py-3.5">
                    Game Name
                  </th>
                  <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-6 py-3.5">
                    Asset Link
                  </th>
                  <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-6 py-3.5">
                    Username
                  </th>
                  <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-6 py-3.5">
                    Password
                  </th>
                  <th className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider px-6 py-3.5">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td className="px-6 py-12 text-center text-sm text-muted-foreground" colSpan={5}>
                      <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
                      Loading links...
                    </td>
                  </tr>
                )}
                {!loading && error && (
                  <tr>
                    <td className="px-6 py-12 text-center text-sm text-destructive" colSpan={5}>
                      {error}
                    </td>
                  </tr>
                )}
                {!loading && !error && groupedLinks.length === 0 && (
                  <tr>
                    <td className="px-6 py-12 text-center text-sm text-muted-foreground" colSpan={5}>
                      No links yet. Click "Add Link" to get started.
                    </td>
                  </tr>
                )}
                {!loading && !error && groupedLinks.map((row, idx) => {
                  const isPinned = pinnedIds.includes(row.ids[0]);
                  return (
                  <tr
                    key={row.gameName}
                    className={`border-b border-border/60 transition-colors hover:bg-muted/30 ${
                      idx % 2 === 0 ? "bg-card" : "bg-muted/10"
                    } ${isPinned ? "bg-primary/5" : ""}`}
                  >
                    <td className="px-6 py-4 text-sm text-foreground font-medium">
                      <div className="flex items-center gap-2">
                        {isPinned && <Pin className="w-3.5 h-3.5 text-primary" />}
                        {row.gameName}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm space-y-1.5">
                      {row.assetUrls.map((url, i) => (
                        <div key={`${row.gameName}-${i}`}>
                          <a
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-primary hover:text-primary/80 break-all underline-offset-2 hover:underline transition-colors"
                          >
                            {url}
                          </a>
                        </div>
                      ))}
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground font-mono">{row.username || "—"}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground font-mono">{row.password || "—"}</td>
                    <td className="px-6 py-4 text-sm text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Pin game"
                          onClick={() => togglePin(row.ids[0])}
                          className={`h-8 w-8 transition-colors ${
                            isPinned ? "text-primary hover:text-primary/80" : "hover:text-foreground"
                          }`}
                        >
                          <Pin className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Edit game link"
                          onClick={() => openEditModal(filteredLinks.find((l) => l.id === row.ids[0]) || links.find((l) => l.gameName === row.gameName)!)}
                          className="h-8 w-8 hover:text-foreground transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Remove game link"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive transition-colors"
                          onClick={() => handleDelete(row.ids[0], row.gameName)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        <Dialog open={dialogOpen} onOpenChange={(open) => !saving && setDialogOpen(open)}>
          <DialogContent className="max-w-5xl">
            <DialogHeader>
              <DialogTitle className="text-xl">{editingLink ? "Edit Link" : "Add New Link"}</DialogTitle>
              <DialogDescription>
                {editingLink ? "Update the selected game asset link." : "Add one or more game asset links with optional credentials."}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-1 scrollbar-soft">
              <div className="hidden md:grid grid-cols-[1.1fr,1.6fr,1fr,1fr,auto] gap-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground pb-2">
                <span>Game name</span>
                <span>Asset link</span>
                <span>Username</span>
                <span>Password</span>
                <span className="text-right">Actions</span>
              </div>

              {formRows.map((row, index) => (
                <div
                  key={index}
                  className="grid grid-cols-1 md:grid-cols-[1.1fr,1.6fr,1fr,1fr,auto] gap-2 md:gap-2 rounded-lg md:rounded-none p-3 md:p-0 md:py-2 border md:border-0 border-border bg-muted/30 md:bg-transparent"
                >
                  <div className="space-y-2">
                    <Label className="md:hidden" htmlFor={`gameName-${index}`}>
                      Game name
                    </Label>
                    <Input
                      id={`gameName-${index}`}
                      value={row.gameName}
                      onChange={(e) => onChange(index, "gameName", e.target.value)}
                      placeholder="Game name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="md:hidden" htmlFor={`assetUrl-${index}`}>
                      Asset link
                    </Label>
                    <Input
                      id={`assetUrl-${index}`}
                      value={row.assetUrl}
                      onChange={(e) => onChange(index, "assetUrl", e.target.value)}
                      placeholder="https://... (space to add more)"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="md:hidden" htmlFor={`username-${index}`}>
                      Username (optional)
                    </Label>
                    <Input
                      id={`username-${index}`}
                      value={row.username}
                      onChange={(e) => onChange(index, "username", e.target.value)}
                      placeholder="Username"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="md:hidden" htmlFor={`password-${index}`}>
                      Password (optional)
                    </Label>
                    <Input
                      id={`password-${index}`}
                      value={row.password}
                      onChange={(e) => onChange(index, "password", e.target.value)}
                      placeholder="Password"
                    />
                  </div>
                  {!editingLink ? (
                    <div className="flex items-center justify-end md:justify-center md:pr-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeRow(index)}
                        disabled={formRows.length === 1}
                        aria-label="Remove row"
                      >
                        <MinusCircle className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="md:pr-2" />
                  )}
                </div>
              ))}

              {!editingLink && (
                <Button variant="outline" onClick={addRow} className="w-full mt-2">
                  <Plus className="w-4 h-4 mr-2" /> Add another row
                </Button>
              )}
            </div>
            <DialogFooter className="mt-4 gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                {editingLink ? "Save changes" : "Add links"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove Game Asset Link?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to remove <strong>{deleteConfirm?.gameName}</strong>? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setDeleteConfirm(null)}>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={confirmDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Remove
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AppLayout>
  );
}
