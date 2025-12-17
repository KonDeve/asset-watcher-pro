import { supabase, isSupabaseConfigured } from "@/lib/supabase";

interface AuthResult {
  userId?: string;
  error?: string | null;
}

const getInitials = (fullName: string) => {
  if (!fullName) return "";
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const ensureDesignerRecord = async (name: string, email: string) => {
  if (!supabase) return null;

  // Check if designer already exists for this email
  const { data: existing, error: fetchError } = await supabase
    .from("designers")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (fetchError) {
    console.error("Error checking designer existence:", fetchError);
  }

  if (existing?.id) return existing.id;

  const avatar = getInitials(name || email);
  const { data, error } = await supabase
    .from("designers")
    .insert({ name: name || email, email, avatar })
    .select("id")
    .single();

  if (error) {
    console.error("Error creating designer record:", error);
    return null;
  }

  return data.id;
};

export const authService = {
  isSupabaseReady: () => isSupabaseConfigured() && !!supabase,

  async signUp({ name, email, password }: { name: string; email: string; password: string; }): Promise<AuthResult> {
    if (!this.isSupabaseReady()) {
      console.warn("Supabase not configured; sign-up skipped.");
      return { error: "Supabase not configured" };
    }

    const { data, error } = await supabase!.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
      },
    });

    if (error) {
      console.error("Error during signUp:", error);
      return { error: error.message };
    }

    // Create designer record in parallel; do not block on error
    await ensureDesignerRecord(name, email);

    return { userId: data.user?.id, error: null };
  },

  async signIn({ email, password }: { email: string; password: string; }): Promise<AuthResult> {
    if (!this.isSupabaseReady()) {
      console.warn("Supabase not configured; sign-in skipped.");
      return { error: "Supabase not configured" };
    }

    const { data, error } = await supabase!.auth.signInWithPassword({ email, password });

    if (error) {
      console.error("Error during signIn:", error);
      return { error: error.message };
    }

    return { userId: data.user?.id, error: null };
  },

  async signOut(): Promise<AuthResult> {
    if (!this.isSupabaseReady()) {
      return { error: null };
    }

    const { error } = await supabase!.auth.signOut();
    if (error) {
      console.error("Error during signOut:", error);
      return { error: error.message };
    }

    return { error: null };
  },

  async resetPassword(email: string): Promise<AuthResult> {
    if (!this.isSupabaseReady()) {
      console.warn("Supabase not configured; password reset skipped.");
      return { error: "Supabase not configured" };
    }

    const redirectTo = `${window.location.origin}/reset-password`;

    const { error } = await supabase!.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    if (error) {
      console.error("Error during resetPassword:", error);
      return { error: error.message };
    }

    return { error: null };
  },
};
