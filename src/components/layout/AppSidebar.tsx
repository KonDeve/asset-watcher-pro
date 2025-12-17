import { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  FileQuestion,
  BarChart3,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
  Gamepad2,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const navItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Missing Assets", url: "/missing-assets", icon: FileQuestion },
  { title: "Reports", url: "/reports", icon: BarChart3 },
  { title: "Team", url: "/team", icon: Users },
  { title: "Settings", url: "/settings", icon: Settings },
];

const secondaryNavItems = [
  { title: "Chat AI", url: "/chat", icon: MessageSquare },
];

const SIDEBAR_COLLAPSED_KEY = "sidebar-collapsed";

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
    return saved === "true";
  });
  const location = useLocation();

  // Persist collapsed state to localStorage
  useEffect(() => {
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(collapsed));
  }, [collapsed]);

  const NavItem = ({ item, isActive }: { item: typeof navItems[0]; isActive: boolean }) => {
    const content = (
      <NavLink
        to={item.url}
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
          isActive
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground"
        )}
      >
        <item.icon className={cn("w-5 h-5 flex-shrink-0", isActive && "text-primary-foreground")} />
        {!collapsed && <span>{item.title}</span>}
      </NavLink>
    );

    if (collapsed) {
      return (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>{content}</TooltipTrigger>
          <TooltipContent side="right" className="font-medium">
            {item.title}
          </TooltipContent>
        </Tooltip>
      );
    }

    return content;
  };

  return (
    <aside
      className={cn(
        "h-screen bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-300 ease-in-out",
        collapsed ? "w-[68px]" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="h-16 flex items-center px-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-sm">
            <Gamepad2 className="w-5 h-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-bold text-foreground text-sm leading-tight tracking-[0.06em] uppercase">Strive</span>
              <span className="text-[10px] text-muted-foreground font-semibold tracking-[0.14em] uppercase">Pro Edition</span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 overflow-y-auto scrollbar-thin">
        <div className="space-y-1">
          {!collapsed && (
            <p className="px-3 mb-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              Main Menu
            </p>
          )}
          <ul className="space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.url;
              return (
                <li key={item.title}>
                  <NavItem item={item} isActive={isActive} />
                </li>
              );
            })}
          </ul>
        </div>

        <div className="mt-8 space-y-1">
          {!collapsed && (
            <p className="px-3 mb-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              Support
            </p>
          )}
          <ul className="space-y-1">
            {secondaryNavItems.map((item) => {
              const isActive = location.pathname === item.url;
              return (
                <li key={item.title}>
                  <NavItem item={item} isActive={isActive} />
                </li>
              );
            })}
          </ul>
        </div>
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-sidebar-border">
        <div className={cn(
          "flex items-center",
          collapsed ? "justify-center" : "justify-between"
        )}>
          {!collapsed && <ThemeToggle />}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={cn(
              "p-2 rounded-lg hover:bg-sidebar-accent text-sidebar-foreground transition-colors",
              collapsed && "w-full flex justify-center"
            )}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </aside>
  );
}
