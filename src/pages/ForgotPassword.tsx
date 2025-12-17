import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Loader2, Mail, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { authService } from "@/services/authService";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const { error } = await authService.resetPassword(email);
    if (error) {
      toast({ title: "Reset failed", description: error, variant: "destructive" });
      setIsLoading(false);
      return;
    }
    setIsLoading(false);
    setIsSubmitted(true);
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary/80" />
        <div className="relative z-10 flex flex-col justify-between p-12 text-primary-foreground">
          <div>
            <h1 className="text-2xl font-bold">Strive</h1>
          </div>
          <div className="space-y-4">
            <h2 className="text-4xl font-bold leading-tight">
              Don't worry, <br />
              it happens to <br />
              the best of us.
            </h2>
            <p className="text-primary-foreground/80 text-lg max-w-md">
              We'll help you reset your password and get back to managing your
              assets in no time.
            </p>
          </div>
          <p className="text-sm text-primary-foreground/60">
            © 2025 Strive. All rights reserved.
          </p>
        </div>
        {/* Decorative elements */}
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-white/5 rounded-full" />
        <div className="absolute top-32 -right-16 w-64 h-64 bg-white/5 rounded-full" />
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <h1 className="text-2xl font-bold text-foreground">Strive</h1>
          </div>

          {!isSubmitted ? (
            <>
              <div className="space-y-2 text-center">
                <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <Mail className="w-6 h-6 text-primary" />
                </div>
                <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                  Forgot password?
                </h2>
                <p className="text-muted-foreground">
                  No worries, we'll send you reset instructions.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Reset password"
                  )}
                </Button>
              </form>
            </>
          ) : (
            <div className="space-y-6 text-center">
              <div className="mx-auto w-12 h-12 bg-success/10 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-success" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                  Check your email
                </h2>
                <p className="text-muted-foreground">
                  We sent a password reset link to
                </p>
                <p className="text-foreground font-medium">{email}</p>
              </div>
              <div className="space-y-3 pt-2">
                <p className="text-sm text-muted-foreground">
                  Didn't receive the email?{" "}
                  <button
                    onClick={() => setIsSubmitted(false)}
                    className="text-primary font-medium hover:text-primary/80 transition-colors"
                  >
                    Click to resend
                  </button>
                </p>
              </div>
            </div>
          )}

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
