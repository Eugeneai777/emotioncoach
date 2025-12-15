import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface ProfileData {
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  profile_completed: boolean | null;
}

interface UseProfileCompletionReturn {
  isComplete: boolean;
  profile: ProfileData | null;
  loading: boolean;
  missingFields: string[];
  refetch: () => Promise<void>;
  updateProfile: (data: Partial<ProfileData>) => Promise<boolean>;
}

export function useProfileCompletion(): UseProfileCompletionReturn {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("display_name, avatar_url, bio, profile_completed")
        .eq("id", user.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error("Error fetching profile:", error);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const updateProfile = async (data: Partial<ProfileData>): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from("profiles")
        .update(data)
        .eq("id", user.id);

      if (error) throw error;
      
      await fetchProfile();
      return true;
    } catch (error) {
      console.error("Error updating profile:", error);
      return false;
    }
  };

  const isComplete = Boolean(
    profile?.display_name && 
    profile?.display_name.trim() !== "" && 
    profile?.avatar_url && 
    profile?.avatar_url.trim() !== ""
  );

  const missingFields: string[] = [];
  if (!profile?.display_name || profile.display_name.trim() === "") {
    missingFields.push("display_name");
  }
  if (!profile?.avatar_url || profile.avatar_url.trim() === "") {
    missingFields.push("avatar_url");
  }

  return {
    isComplete,
    profile,
    loading,
    missingFields,
    refetch: fetchProfile,
    updateProfile,
  };
}
