import { Link, useNavigate } from "react-router-dom";
import { Bell, Search, LogOut, User, Settings, CreditCard, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useCurrentUser } from "@/hooks/use-current-user";
import { authService } from "@/services/authService";

const getInitials = (name?: string, fallback?: string) => {
  const source = name?.trim() || fallback || "";
  if (!source) return "";
  const parts = source.split(/\s+/);
  if (parts.length === 1) {
    const handle = source.includes("@") ? source.split("@")[0] : source;
    return handle.slice(0, 2).toUpperCase();
  }
  return `${(parts[0][0] || "").toUpperCase()}${(parts[parts.length - 1][0] || "").toUpperCase()}`;
};

export function TopNavbar() {
  const navigate = useNavigate();
  const { user, profile } = useCurrentUser();

  const metadata = (user?.user_metadata || {}) as { full_name?: string; avatar_url?: string };
  const displayName = profile?.name || metadata.full_name || user?.email || "Guest";
  const email = profile?.email || user?.email || "";
  const avatar = profile?.avatar || metadata.avatar_url || "";
  const initials = profile?.initials || getInitials(displayName, email);

  const handleLogout = async () => {
    await authService.signOut();
    try {
      localStorage.clear();
    } catch (err) {
      console.error("Failed to clear localStorage on logout", err);
    }
    navigate("/login");
  };

  return (
    <header className="h-16 border-b border-border bg-card/80 backdrop-blur-sm flex items-center justify-end px-6 shrink-0">
      {/* Right side */}
      <div className="flex items-center gap-3">
        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative h-9 w-9">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full" />
        </Button>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="h-9 gap-2 pl-2 pr-3 hover:bg-muted/50"
            >
              <Avatar className="h-7 w-7">
                <AvatarImage src={avatar || undefined} alt={displayName} />
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="hidden sm:flex flex-col items-start">
                <span className="text-sm font-medium leading-tight">{displayName}</span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" sideOffset={8}>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{displayName}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link to="/profile" className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/settings" className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className="text-destructive focus:text-destructive cursor-pointer"
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
