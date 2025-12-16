import { AppLayout } from "@/components/layout/AppLayout";
import { useTheme } from "@/components/ThemeProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Moon, Sun, Bell, Lock, Database, Palette } from "lucide-react";

export default function Settings() {
  const { theme, setTheme } = useTheme();

  return (
    <AppLayout>
      <div className="p-6 max-w-2xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-foreground">Settings</h1>
          <p className="text-sm text-muted-foreground">
            Manage your application preferences
          </p>
        </div>

        <div className="space-y-6">
          {/* Appearance */}
          <div className="card-compact">
            <div className="flex items-center gap-2 mb-4">
              <Palette className="w-4 h-4 text-muted-foreground" />
              <h2 className="font-medium text-foreground">Appearance</h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Dark Mode
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Toggle between light and dark themes
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Sun className="w-4 h-4 text-muted-foreground" />
                  <Switch
                    checked={theme === "dark"}
                    onCheckedChange={(checked) =>
                      setTheme(checked ? "dark" : "light")
                    }
                  />
                  <Moon className="w-4 h-4 text-muted-foreground" />
                </div>
              </div>
            </div>
          </div>

          {/* Notifications */}
          <div className="card-compact">
            <div className="flex items-center gap-2 mb-4">
              <Bell className="w-4 h-4 text-muted-foreground" />
              <h2 className="font-medium text-foreground">Notifications</h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Email Notifications
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Receive updates via email
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Assignment Alerts
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Get notified when assigned to a task
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Status Updates
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Notify when task status changes
                  </p>
                </div>
                <Switch />
              </div>
            </div>
          </div>

          {/* Data & Storage */}
          <div className="card-compact">
            <div className="flex items-center gap-2 mb-4">
              <Database className="w-4 h-4 text-muted-foreground" />
              <h2 className="font-medium text-foreground">Data & Storage</h2>
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
                  <p className="text-sm font-medium text-foreground">
                    Auto-save Drafts
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Automatically save form drafts
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
            </div>
          </div>

          {/* Security */}
          <div className="card-compact">
            <div className="flex items-center gap-2 mb-4">
              <Lock className="w-4 h-4 text-muted-foreground" />
              <h2 className="font-medium text-foreground">Security</h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Require Password for Sharing
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Password protect shared links
                  </p>
                </div>
                <Switch />
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button>Save Changes</Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
