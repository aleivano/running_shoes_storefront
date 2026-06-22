"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export type ProfileActionState = {
  error?: string;
  success?: string;
};

const cleanUsername = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "");

export async function updateProfile(
  _previousState: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  if (!isSupabaseConfigured) {
    return { error: "Supabase environment variables are not configured." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in to update your profile." };
  }

  const username = cleanUsername(formData.get("username")?.toString() ?? "");
  const displayName = formData.get("displayName")?.toString().trim() || null;
  const phone = formData.get("phone")?.toString().trim() || null;
  const avatarUrl = formData.get("avatarUrl")?.toString().trim() || null;

  if (username.length < 3) {
    return { error: "Username must be at least 3 characters." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      username,
      display_name: displayName,
      phone,
      avatar_url: avatarUrl,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/account");
  return { success: "Profile updated." };
}
