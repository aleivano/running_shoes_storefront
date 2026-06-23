"use server";

import { revalidatePath } from "next/cache";
import { getAdminSessionContext } from "@/lib/data";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import type { AppRole } from "@/lib/types";

export type AdminActionState = {
  error?: string;
  success?: string;
};

const appRoles = new Set<AppRole>(["customer", "catalog_editor", "admin"]);

export async function updateUserRole(
  _previousState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  if (!isSupabaseConfigured) {
    return { error: "Supabase environment variables are not configured." };
  }

  const session = await getAdminSessionContext();

  if (!session.canManageUsers) {
    return { error: "Only admins can assign user roles." };
  }

  const userId = formData.get("userId")?.toString();
  const role = formData.get("role")?.toString() as AppRole | undefined;

  if (!userId || !role || !appRoles.has(role)) {
    return { error: "Choose a valid user and role." };
  }

  if (userId === session.userId && role !== "admin") {
    return { error: "Admins cannot remove their own admin access from this screen." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      role,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/users");
  revalidatePath("/admin");
  return { success: "User role updated." };
}
