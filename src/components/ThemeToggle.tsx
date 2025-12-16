import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      className="gap-2 text-muted-foreground hover:text-foreground"
    >
      {theme === "light" ? (
        <>
          <Moon className="w-4 h-4" />
          <span className="text-xs">Dark</span>
        </>
      ) : (
        <>
          <Sun className="w-4 h-4" />
          <span className="text-xs">Light</span>
        </>
      )}
    </Button>
  );
}
