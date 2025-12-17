import { useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

interface CurrentProfile {
  name: string;
  email: string;
  avatar?: string | null;
  initials: string;
}

const getInitials = (name?: string, email?: string | null) => {
  const source = name?.trim() || email || "";
  if (!source) return "";
  const parts = source.split(/\s+/);
  if (parts.length === 1) {
    const handle = source.includes("@") ? source.split("@")[0] : source;
    return handle.slice(0, 2).toUpperCase();
  }
  return `${(parts[0][0] || "").toUpperCase()}${(parts[parts.length - 1][0] || "").toUpperCase()}`;
};

export function useCurrentUser() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<CurrentProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const client = supabase;
    if (!isSupabaseConfigured() || !client) {
      setLoading(false);
      return;
    }

    let isMounted = true;

    const loadProfile = async (sessionUser: User) => {
      const email = sessionUser.email;
      if (!email) {
        setProfile(null);
        return;
      }

      const { data: designer, error } = await client
        .from("designers")
        .select("name, avatar")
        .eq("email", email)
        .maybeSingle();

      if (error) {
        console.error("Error fetching designer profile:", error);
      }

      const metadata = (sessionUser.user_metadata || {}) as { full_name?: string; avatar_url?: string };
      const displayName = designer?.name || metadata.full_name || email;
      const avatar = designer?.avatar || metadata.avatar_url;

      setProfile({
        name: displayName || email,
        email,
        avatar,
        initials: getInitials(displayName, email),
      });
    };

    const loadUser = async () => {
      const { data, error } = await client.auth.getSession();
      if (!isMounted) return;

      if (error) {
        console.error("Error fetching session:", error);
        setUser(null);
        setProfile(null);
        setLoading(false);
        return;
      }

      const sessionUser = data.session?.user ?? null;
      setUser(sessionUser);
      if (sessionUser?.email) {
        await loadProfile(sessionUser);
      } else {
        setProfile(null);
      }
      setLoading(false);
    };

    const { data: authListener } = client.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return;
      const sessionUser = session?.user ?? null;
      setUser(sessionUser);
      if (sessionUser?.email) {
        loadProfile(sessionUser);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    loadUser();

    return () => {
      isMounted = false;
      authListener?.subscription.unsubscribe();
    };
  }, []);

  return { user, profile, loading };
}
