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
import { useToast } from "@/hooks/use-toast";
import { useGameAssetLinks } from "@/hooks/useData";
import { GameAssetLink } from "@/types/gameAsset";
import { Loader2, MinusCircle, Pencil, Plus, Search } from "lucide-react";

export default function GameAssetsLinks() {
  const { links, loading, error, addLink, updateLink } = useGameAssetLinks();
  const { toast } = useToast();
  const [formRows, setFormRows] = useState([
    { gameName: "", assetUrl: "", username: "", password: "" },
  ]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<GameAssetLink | null>(null);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);

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
    return Array.from(map.values());
  }, [filteredLinks]);

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

  const handleSave = async () => {
    const trimmedRows = formRows.map((row) => ({
      gameName: row.gameName.trim(),
      assetUrl: row.assetUrl.trim(),
      username: row.username.trim(),
      password: row.password.trim(),
    }));

    const baseGameName = trimmedRows.find((r) => r.gameName)?.gameName || "";
    const nameMismatch = trimmedRows.some((r) => r.gameName && r.gameName !== baseGameName);

    if (!baseGameName || nameMismatch) {
      toast({
        title: "Game name required",
        description: nameMismatch
          ? "Use the same game name for all links."
          : "Provide a game name to save links.",
        variant: "destructive",
      });
      return;
    }

    // Split whitespace-separated links so one row can create multiple links, all under the same game name
    const expandedPayloads = trimmedRows.flatMap((row) => {
      const links = row.assetUrl.split(/\s+/).filter(Boolean);
      return links.map((link) => ({
        gameName: baseGameName,
        assetUrl: link,
        username: row.username,
        password: row.password,
      }));
    });

    const invalid = expandedPayloads.find((row) => !row.assetUrl);
    if (invalid || expandedPayloads.length === 0) {
      toast({
        title: "Missing info",
        description: "Each row needs at least one asset link.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);

    if (editingLink) {
      // For edit, only take the first link input
      const saved = await updateLink(editingLink.id, expandedPayloads[0]);
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
      <div className="p-4 lg:p-6 space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-foreground">Game Assets Links</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Quick access to asset links with credentials (shown in plain text).
            </p>
          </div>
          <Badge variant="secondary">Credentials Visible</Badge>
        </div>

        <Card className="p-4 border border-border">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex w-full items-center gap-2 lg:max-w-xl">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder="Search by game, URL, username, or password"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
            <Button onClick={openAddModal} className="w-full lg:w-auto">
              <Plus className="w-4 h-4 mr-2" /> Add Link
            </Button>
          </div>
        </Card>

        <Card className="overflow-hidden border border-border">
          <div className="overflow-auto">
            <table className="min-w-full border-collapse">
              <thead className="bg-muted/60 border-b border-border">
                <tr>
                  <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">
                    Game Name
                  </th>
                  <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">
                    Asset Link
                  </th>
                  <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">
                    Username
                  </th>
                  <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">
                    Password
                  </th>
                  <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td className="px-4 py-6 text-sm text-muted-foreground" colSpan={5}>
                      Loading...
                    </td>
                  </tr>
                )}
                {!loading && error && (
                  <tr>
                    <td className="px-4 py-6 text-sm text-destructive" colSpan={5}>
                      {error}
                    </td>
                  </tr>
                )}
                {!loading && !error && groupedLinks.length === 0 && (
                  <tr>
                    <td className="px-4 py-6 text-sm text-muted-foreground" colSpan={5}>
                      No links yet.
                    </td>
                  </tr>
                )}
                {!loading && !error && groupedLinks.map((row, idx) => (
                  <tr
                    key={row.gameName}
                    className={`border-b border-border/60 ${idx % 2 === 0 ? "bg-card" : "bg-muted/10"}`}
                  >
                    <td className="px-4 py-3 text-sm text-foreground font-medium">{row.gameName}</td>
                    <td className="px-4 py-3 text-sm space-y-1">
                      {row.assetUrls.map((url, i) => (
                        <div key={`${row.gameName}-${i}`}>
                          <a
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-primary hover:text-primary/80 break-all"
                          >
                            {url}
                          </a>
                        </div>
                      ))}
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground">{row.username}</td>
                    <td className="px-4 py-3 text-sm text-foreground">{row.password}</td>
                    <td className="px-4 py-3 text-sm text-right">
                      <Button variant="ghost" size="sm" onClick={() => openEditModal(filteredLinks.find((l) => l.id === row.ids[0]) || links.find((l) => l.gameName === row.gameName)!)}>
                        <Pencil className="w-4 h-4 mr-2" /> Edit
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Dialog open={dialogOpen} onOpenChange={(open) => !saving && setDialogOpen(open)}>
          <DialogContent className="max-w-5xl">
            <DialogHeader>
              <DialogTitle>{editingLink ? "Edit Link" : "Add Link"}</DialogTitle>
              <DialogDescription>
                {editingLink ? "Update the selected game asset link." : "Add a new game asset link."}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-1 max-h-[70vh] overflow-y-auto pr-1 scrollbar-soft">
              <div className="hidden md:grid grid-cols-[1.1fr,1.6fr,1fr,1fr,auto] gap-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                <span>Game name</span>
                <span>Asset link</span>
                <span>Username</span>
                <span>Password</span>
                <span className="text-right">Actions</span>
              </div>

              {formRows.map((row, index) => (
                <div
                  key={index}
                  className="grid grid-cols-1 md:grid-cols-[1.1fr,1.6fr,1fr,1fr,auto] gap-1 md:gap-1.5 rounded-md md:rounded-none p-1 md:p-0 md:py-1"
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
                <Button variant="outline" onClick={addRow} className="w-full">
                  <Plus className="w-4 h-4 mr-2" /> Add another row
                </Button>
              )}
            </div>
            <DialogFooter className="mt-2">
              <Button variant="secondary" onClick={() => setDialogOpen(false)} disabled={saving}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                {editingLink ? "Save changes" : "Add link"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
