"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export async function toggleFavorite(productId: number, isFavorite: boolean) {
  if (!isSupabaseConfigured) {
    return { error: "Supabase environment variables are not configured." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Sign in to save favorites." };
  }

  const result = isFavorite
    ? await supabase
        .from("favorites")
        .delete()
        .eq("user_id", user.id)
        .eq("product_id", productId)
    : await supabase.from("favorites").insert({
        user_id: user.id,
        product_id: productId,
      });

  if (result.error) {
    return { error: result.error.message };
  }

  revalidatePath("/");
  revalidatePath("/account/favorites");
  return { success: true };
}
