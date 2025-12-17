import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Camera,
  Mail,
  Phone,
  MapPin,
  Building2,
  Calendar,
  Shield,
  Bell,
  Loader2,
  Check,
  HelpCircle,
  MessageSquare,
  BookOpen,
  FileText,
  ExternalLink,
  ChevronRight,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { useCurrentUser } from "@/hooks/use-current-user";

// Mock user data
const userData = {
  name: "John Doe",
  email: "john.doe@company.com",
  phone: "+1 (555) 123-4567",
  location: "San Francisco, CA",
  company: "Acme Corporation",
  role: "Admin",
  bio: "Product designer with a passion for creating intuitive user experiences. I love working with creative teams to build beautiful products.",
  avatar: "",
  initials: "JD",
  joinedDate: "January 2024",
};

export default function Profile() {
  const { user, profile } = useCurrentUser();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState(userData);
  const { toast } = useToast();

  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    updates: false,
    marketing: false,
  });

  const computeInitials = (name?: string, email?: string) => {
    const source = name?.trim() || email || "";
    if (!source) return "";
    const parts = source.split(/\s+/);
    if (parts.length === 1) {
      const handle = source.includes("@") ? source.split("@")[0] : source;
      return handle.slice(0, 2).toUpperCase();
    }
    return `${(parts[0][0] || "").toUpperCase()}${(parts[parts.length - 1][0] || "").toUpperCase()}`;
  };

  // Sync form with current profile when available
  useEffect(() => {
    if (profile) {
      setFormData((prev) => ({
        ...prev,
        name: profile.name || prev.name,
        email: profile.email || prev.email,
        avatar: profile.avatar || prev.avatar,
        initials: profile.initials || prev.initials,
      }));
    }
  }, [profile]);

  const handleSave = async () => {
    setIsSaving(true);

    const fallbackInitials = computeInitials(formData.name, formData.email);
    const payload = {
      name: formData.name,
      email: formData.email,
      avatar: (formData.initials || fallbackInitials).slice(0, 10),
    };

    // If Supabase is configured, persist to designers table (email is unique)
    if (isSupabaseConfigured() && supabase) {
      const { error } = await supabase
        .from("designers")
        .upsert(payload, { onConflict: "email" });

      if (error) {
        console.error("Failed to save profile", error);
        toast({
          title: "Save failed",
          description: "Could not update your profile right now.",
          variant: "destructive",
        });
        setIsSaving(false);
        return;
      }
    } else {
      // Mock fallback when Supabase isn't configured
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    setFormData((prev) => ({ ...prev, initials: payload.avatar }));
    setIsSaving(false);
    setIsEditing(false);
    toast({
      title: "Profile updated",
      description: "Your changes have been saved successfully.",
    });
  };

  return (
    <AppLayout>
      <div className="flex-1 h-full overflow-y-auto scrollbar-thin">
        <div className="max-w-4xl mx-auto p-6 lg:p-8 space-y-8 pb-12">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Profile</h1>
            <p className="text-muted-foreground mt-1">
              Manage your account settings and preferences
            </p>
          </div>

          {/* Profile Card */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-6">
                {/* Avatar */}
                <div className="flex flex-col items-center gap-3">
                  <div className="relative group">
                    <Avatar className="h-24 w-24 ring-4 ring-background shadow-lg">
                      <AvatarImage src={formData.avatar} alt={formData.name} />
                      <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-semibold">
                        {formData.initials}
                      </AvatarFallback>
                    </Avatar>
                    <button className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                      <Camera className="w-6 h-6 text-white" />
                    </button>
                  </div>
                  <Button variant="outline" size="sm">
                    Change photo
                  </Button>
                </div>

                {/* Info */}
                <div className="flex-1 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                      <h2 className="text-xl font-semibold text-foreground">
                        {formData.name}
                      </h2>
                      <p className="text-muted-foreground">{formData.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="font-medium">
                        <Shield className="w-3 h-3 mr-1" />
                        {formData.role}
                      </Badge>
                      <Badge className="bg-success/10 text-success hover:bg-success/20 font-medium">
                        <Check className="w-3 h-3 mr-1" />
                        Verified
                      </Badge>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground">{formData.bio}</p>

                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Building2 className="w-4 h-4" />
                      {formData.company}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4" />
                      {formData.location}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4" />
                      Joined {formData.joinedDate}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Personal Information */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <div>
                <CardTitle className="text-lg">Personal Information</CardTitle>
                <CardDescription>
                  Update your personal details here
                </CardDescription>
              </div>
              {!isEditing ? (
                <Button variant="outline" onClick={() => setIsEditing(true)}>
                  Edit
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setIsEditing(false);
                      setFormData(userData);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save changes"
                    )}
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Full name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    disabled={!isEditing}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      disabled={!isEditing}
                      className="pl-9"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      disabled={!isEditing}
                      className="pl-9"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) =>
                        setFormData({ ...formData, location: e.target.value })
                      }
                      disabled={!isEditing}
                      className="pl-9"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) =>
                    setFormData({ ...formData, bio: e.target.value })
                  }
                  disabled={!isEditing}
                  className="min-h-24 resize-none"
                  placeholder="Write a short bio about yourself..."
                />
              </div>
            </CardContent>
          </Card>

          {/* Notification Preferences */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Notification Preferences
              </CardTitle>
              <CardDescription>
                Choose how you want to receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between py-2">
                <div className="space-y-0.5">
                  <Label className="font-medium">Email notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive email updates about your account activity
                  </p>
                </div>
                <Switch
                  checked={notifications.email}
                  onCheckedChange={(checked) =>
                    setNotifications({ ...notifications, email: checked })
                  }
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between py-2">
                <div className="space-y-0.5">
                  <Label className="font-medium">Push notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive push notifications on your devices
                  </p>
                </div>
                <Switch
                  checked={notifications.push}
                  onCheckedChange={(checked) =>
                    setNotifications({ ...notifications, push: checked })
                  }
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between py-2">
                <div className="space-y-0.5">
                  <Label className="font-medium">Product updates</Label>
                  <p className="text-sm text-muted-foreground">
                    News about product and feature updates
                  </p>
                </div>
                <Switch
                  checked={notifications.updates}
                  onCheckedChange={(checked) =>
                    setNotifications({ ...notifications, updates: checked })
                  }
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between py-2">
                <div className="space-y-0.5">
                  <Label className="font-medium">Marketing emails</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive emails about new products, features, and more
                  </p>
                </div>
                <Switch
                  checked={notifications.marketing}
                  onCheckedChange={(checked) =>
                    setNotifications({ ...notifications, marketing: checked })
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Help & Support */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <HelpCircle className="w-5 h-5" />
                Help & Support
              </CardTitle>
              <CardDescription>
                Get help with using Asset Watcher Pro
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Quick Actions */}
              <div className="grid gap-3 sm:grid-cols-2">
                <button className="flex items-center gap-4 p-4 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors text-left group">
                  <div className="p-2.5 rounded-lg bg-primary/10 text-primary">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground">Documentation</p>
                    <p className="text-sm text-muted-foreground truncate">
                      Browse guides and tutorials
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                </button>

                <button className="flex items-center gap-4 p-4 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors text-left group">
                  <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-500">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground">Contact Support</p>
                    <p className="text-sm text-muted-foreground truncate">
                      Get help from our team
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                </button>
              </div>

              <Separator />

              {/* Help Links */}
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground mb-3">Resources</p>
                
                <a
                  href="#"
                  className="flex items-center justify-between py-2.5 px-3 rounded-md hover:bg-muted/50 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Getting Started Guide</span>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
                
                <a
                  href="#"
                  className="flex items-center justify-between py-2.5 px-3 rounded-md hover:bg-muted/50 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Keyboard Shortcuts</span>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
                
                <a
                  href="#"
                  className="flex items-center justify-between py-2.5 px-3 rounded-md hover:bg-muted/50 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">FAQs</span>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
                
                <a
                  href="#"
                  className="flex items-center justify-between py-2.5 px-3 rounded-md hover:bg-muted/50 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Release Notes</span>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
              </div>

              <Separator />

              {/* App Info */}
              <div className="flex items-center justify-between pt-2">
                <div>
                  <p className="text-sm font-medium text-foreground">Asset Watcher Pro</p>
                  <p className="text-xs text-muted-foreground">Version 1.0.0</p>
                </div>
                <Button variant="outline" size="sm">
                  Check for updates
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-destructive/50">
            <CardHeader>
              <CardTitle className="text-lg text-destructive">Danger Zone</CardTitle>
              <CardDescription>
                Irreversible and destructive actions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 rounded-lg bg-destructive/5 border border-destructive/20">
                <div>
                  <p className="font-medium text-foreground">Delete account</p>
                  <p className="text-sm text-muted-foreground">
                    Permanently delete your account and all associated data
                  </p>
                </div>
                <Button variant="destructive" size="sm">
                  Delete account
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
