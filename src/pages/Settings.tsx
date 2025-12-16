import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useTheme } from "@/components/ThemeProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Moon,
  Sun,
  Bell,
  Lock,
  Database,
  Palette,
  Building2,
  Globe,
  Layers,
  Plus,
  Trash2,
  Edit2,
  X,
} from "lucide-react";
import { brandOptions, providerOptions } from "@/data/mockData";
import { useToast } from "@/hooks/use-toast";

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();

  const [brands, setBrands] = useState(brandOptions);
  const [providers, setProviders] = useState(providerOptions);
  const [aggregators, setAggregators] = useState([
    { id: "1", name: "SoftSwiss", color: "#3b82f6" },
    { id: "2", name: "Slotegrator", color: "#10b981" },
    { id: "3", name: "EveryMatrix", color: "#f59e0b" },
  ]);

  const handleSave = () => {
    toast({
      title: "Settings saved",
      description: "Your preferences have been updated.",
    });
  };

  return (
    <AppLayout>
      <div className="p-4 lg:p-6 h-full overflow-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-xl lg:text-2xl font-semibold text-foreground">Settings</h1>
          <p className="text-sm text-muted-foreground">
            Manage your application preferences and data
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
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

            {/* Notifications */}
            <div className="bg-card border border-border rounded-lg p-4 lg:p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Bell className="w-4 h-4 text-primary" />
                </div>
                <h2 className="font-semibold text-foreground">Notifications</h2>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">Email Notifications</p>
                    <p className="text-xs text-muted-foreground">Receive updates via email</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">Assignment Alerts</p>
                    <p className="text-xs text-muted-foreground">Get notified when assigned</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">Status Updates</p>
                    <p className="text-xs text-muted-foreground">Notify on status changes</p>
                  </div>
                  <Switch />
                </div>
              </div>
            </div>

            {/* Data & Storage */}
            <div className="bg-card border border-border rounded-lg p-4 lg:p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Database className="w-4 h-4 text-primary" />
                </div>
                <h2 className="font-semibold text-foreground">Data & Storage</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="exportFormat" className="text-sm">
                    Default Export Format
                  </Label>
                  <Input
                    id="exportFormat"
                    defaultValue="JSON"
                    className="mt-1 max-w-xs"
                    readOnly
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">Auto-save Drafts</p>
                    <p className="text-xs text-muted-foreground">Save form drafts automatically</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
            </div>

            {/* Security */}
            <div className="bg-card border border-border rounded-lg p-4 lg:p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Lock className="w-4 h-4 text-primary" />
                </div>
                <h2 className="font-semibold text-foreground">Security</h2>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">Password Protected Links</p>
                  <p className="text-xs text-muted-foreground">Require password for shared links</p>
                </div>
                <Switch />
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Brands */}
            <div className="bg-card border border-border rounded-lg p-4 lg:p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Globe className="w-4 h-4 text-primary" />
                  </div>
                  <h2 className="font-semibold text-foreground">Brands / Websites</h2>
                </div>
                <Button variant="outline" size="sm">
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Add
                </Button>
              </div>

              <div className="space-y-2">
                {brands.map((brand) => (
                  <div
                    key={brand.id}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30 border border-border group"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: brand.color }}
                      />
                      <span className="text-sm font-medium text-foreground">{brand.name}</span>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive">
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Providers */}
            <div className="bg-card border border-border rounded-lg p-4 lg:p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Building2 className="w-4 h-4 text-primary" />
                  </div>
                  <h2 className="font-semibold text-foreground">Game Providers</h2>
                </div>
                <Button variant="outline" size="sm">
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Add
                </Button>
              </div>

              <div className="flex flex-wrap gap-2">
                {providers.map((provider, idx) => (
                  <Badge
                    key={idx}
                    variant="secondary"
                    className="px-3 py-1.5 text-xs font-medium cursor-pointer hover:bg-destructive/10 hover:text-destructive transition-colors group"
                  >
                    {provider}
                    <X className="w-3 h-3 ml-1.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Badge>
                ))}
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
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: aggregator.color }}
                      />
                      <span className="text-sm font-medium text-foreground">{aggregator.name}</span>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive">
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
        </div>

        {/* Save Button */}
        <div className="flex justify-end mt-6 pt-4 border-t border-border">
          <Button onClick={handleSave}>Save Changes</Button>
        </div>
      </div>
    </AppLayout>
  );
}