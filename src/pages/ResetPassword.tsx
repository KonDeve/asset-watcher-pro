import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Loader2, LockKeyhole, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<"checking" | "ready" | "done" | "invalid">("checking");
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isSupabaseConfigured() || !supabase) {
      setStatus("invalid");
      return;
    }

    let isMounted = true;

    const checkSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (!isMounted) return;
      if (error || !data.session) {
        setStatus("invalid");
        return;
      }
      setStatus("ready");
    };

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return;
      if (event === "PASSWORD_RECOVERY" || session) {
        setStatus("ready");
      }
    });

    checkSession();

    return () => {
      isMounted = false;
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) {
      toast({ title: "Reset unavailable", description: "Supabase is not configured.", variant: "destructive" });
      return;
    }

    if (password !== confirmPassword) {
      toast({ title: "Passwords do not match", description: "Please confirm your new password.", variant: "destructive" });
      return;
    }

    if (password.length < 8) {
      toast({ title: "Password too short", description: "Use at least 8 characters.", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      toast({ title: "Reset failed", description: error.message, variant: "destructive" });
      setIsLoading(false);
      return;
    }

    setIsLoading(false);
    setStatus("done");
    toast({ title: "Password updated", description: "You can now log in with your new password." });
  };

  const renderContent = () => {
    if (status === "checking") {
      return (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
          <Loader2 className="w-6 h-6 animate-spin" />
          <p>Preparing password reset...</p>
        </div>
      );
    }

    if (status === "invalid") {
      return (
        <div className="space-y-6 text-center">
          <div className="mx-auto w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center">
            <ShieldAlert className="w-6 h-6 text-destructive" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">Link is expired</h2>
            <p className="text-muted-foreground">Request a new password reset link to continue.</p>
          </div>
          <div className="flex flex-col gap-3">
            <Button onClick={() => navigate("/forgot-password")}>Send new link</Button>
            <Button variant="outline" onClick={() => navigate("/login")}>Back to login</Button>
          </div>
        </div>
      );
    }

    if (status === "done") {
      return (
        <div className="space-y-6 text-center">
          <div className="mx-auto w-12 h-12 bg-success/10 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6 text-success" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">Password updated</h2>
            <p className="text-muted-foreground">You can now sign in with your new password.</p>
          </div>
          <Button className="w-full" onClick={() => navigate("/login")}>Go to login</Button>
        </div>
      );
    }

    return (
      <>
        <div className="space-y-2 text-center">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <LockKeyhole className="w-6 h-6 text-primary" />
          </div>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">Set a new password</h2>
          <p className="text-muted-foreground">Enter and confirm your new password to finish resetting.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="password">New password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter a new password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm password</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Repeat your new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading || status !== "ready"}>
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Updating password...
              </>
            ) : (
              "Update password"
            )}
          </Button>
        </form>
      </>
    );
  };

  return (
    <div className="min-h-screen flex bg-background">
      <div className="hidden lg:flex lg:w-1/2 bg-primary relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary/80" />
        <div className="relative z-10 flex flex-col justify-between p-12 text-primary-foreground">
          <div>
            <h1 className="text-2xl font-bold"></h1>
          </div>
          <div className="space-y-4">
            <h2 className="text-4xl font-bold leading-tight">
              Secure your account <br />
              with a fresh <br />
              password.
            </h2>
            <p className="text-primary-foreground/80 text-lg max-w-md">
              Finish resetting your password to get back to monitoring your assets confidently.
            </p>
          </div>
          <p className="text-sm text-primary-foreground/60">
            © 2025 . All rights reserved.
          </p>
        </div>
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-white/5 rounded-full" />
        <div className="absolute top-32 -right-16 w-64 h-64 bg-white/5 rounded-full" />
      </div>

      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          <div className="lg:hidden text-center mb-8">
            <h1 className="text-2xl font-bold text-foreground"></h1>
          </div>

          {renderContent()}

          <div className="pt-4">
            <Link
              to="/login"
              className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
