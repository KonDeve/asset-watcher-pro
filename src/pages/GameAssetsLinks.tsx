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
import { Loader2, Pencil, Plus, Search } from "lucide-react";

export default function GameAssetsLinks() {
  const { links, loading, error, addLink, updateLink } = useGameAssetLinks();
  const { toast } = useToast();
  const [form, setForm] = useState({
    gameName: "",
    assetUrl: "",
    username: "",
    password: "",
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<GameAssetLink | null>(null);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);

  const onChange = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
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

  const openAddModal = () => {
    setEditingLink(null);
    setForm({ gameName: "", assetUrl: "", username: "", password: "" });
    setDialogOpen(true);
  };

  const openEditModal = (link: GameAssetLink) => {
    setEditingLink(link);
    setForm({
      gameName: link.gameName,
      assetUrl: link.assetUrl,
      username: link.username,
      password: link.password,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.gameName.trim() || !form.assetUrl.trim()) {
      toast({ title: "Missing info", description: "Game name and asset link are required.", variant: "destructive" });
      return;
    }

    setSaving(true);
    const payload = {
      gameName: form.gameName.trim(),
      assetUrl: form.assetUrl.trim(),
      username: form.username.trim(),
      password: form.password.trim(),
    };

    const saved = editingLink
      ? await updateLink(editingLink.id, payload)
      : await addLink(payload);

    setSaving(false);

    if (saved) {
      toast({
        title: editingLink ? "Link updated" : "Link added",
        description: saved.gameName,
      });
      setDialogOpen(false);
      setForm({ gameName: "", assetUrl: "", username: "", password: "" });
      setEditingLink(null);
    } else {
      toast({
        title: editingLink ? "Update failed" : "Add failed",
        description: editingLink ? "Could not update link." : "Could not create link.",
        variant: "destructive",
      });
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
                {!loading && !error && filteredLinks.length === 0 && (
                  <tr>
                    <td className="px-4 py-6 text-sm text-muted-foreground" colSpan={5}>
                      No links yet.
                    </td>
                  </tr>
                )}
                {!loading && !error && filteredLinks.map((row, idx) => (
                  <tr
                    key={row.id}
                    className={`border-b border-border/60 ${idx % 2 === 0 ? "bg-card" : "bg-muted/10"}`}
                  >
                    <td className="px-4 py-3 text-sm text-foreground font-medium">{row.gameName}</td>
                    <td className="px-4 py-3 text-sm">
                      <a
                        href={row.assetUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary hover:underline break-all"
                      >
                        {row.assetUrl}
                      </a>
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground">{row.username}</td>
                    <td className="px-4 py-3 text-sm text-foreground">{row.password}</td>
                    <td className="px-4 py-3 text-sm text-right">
                      <Button variant="ghost" size="sm" onClick={() => openEditModal(row)}>
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
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingLink ? "Edit Link" : "Add Link"}</DialogTitle>
              <DialogDescription>
                {editingLink ? "Update the selected game asset link." : "Add a new game asset link."}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="gameName">Game name</Label>
                <Input
                  id="gameName"
                  value={form.gameName}
                  onChange={(e) => onChange("gameName", e.target.value)}
                  placeholder="Game name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="assetUrl">Asset link</Label>
                <Input
                  id="assetUrl"
                  value={form.assetUrl}
                  onChange={(e) => onChange("assetUrl", e.target.value)}
                  placeholder="https://..."
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username (optional)</Label>
                  <Input
                    id="username"
                    value={form.username}
                    onChange={(e) => onChange("username", e.target.value)}
                    placeholder="Username"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password (optional)</Label>
                  <Input
                    id="password"
                    value={form.password}
                    onChange={(e) => onChange("password", e.target.value)}
                    placeholder="Password"
                  />
                </div>
              </div>
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
