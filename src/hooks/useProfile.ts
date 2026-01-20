import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export type Profile = {
  id: string;
  user_id: string;
  shop_id: string;
  role: "owner" | "staff";
  full_name: string | null;
  active: boolean;
};

export function useProfile(userId?: string) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    const loadProfile = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (cancelled) return;

      if (error) {
        console.error("useProfile error:", error);
        setError(error.message);
        setProfile(null);
      } else {
        setProfile(data);
        setError(null);
      }

      setLoading(false);
    };

    loadProfile();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  return { profile, loading, error };
}
