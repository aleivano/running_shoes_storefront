"use server";

import { revalidatePath } from "next/cache";
import { getAdminSessionContext } from "@/lib/data";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import type { ProductStatus } from "@/lib/types";

export type CatalogActionState = {
  error?: string;
  success?: string;
};

const productStatuses = new Set<ProductStatus>(["active", "archived"]);

const readProductForm = (formData: FormData) => {
  const name = formData.get("name")?.toString().trim() ?? "";
  const description = formData.get("description")?.toString().trim() ?? "";
  const price = Number(formData.get("price"));
  const imageUrl = formData.get("imageUrl")?.toString().trim() ?? "";
  const inventory = Number(formData.get("inventory"));
  const status = formData.get("status")?.toString() as ProductStatus | undefined;

  if (name.length < 3) {
    return { error: "Product name must be at least 3 characters." };
  }

  if (description.length < 12) {
    return { error: "Description must be at least 12 characters." };
  }

  if (!Number.isInteger(price) || price < 0) {
    return { error: "Price must be a whole number greater than or equal to 0." };
  }

  try {
    const parsedUrl = new URL(imageUrl);

    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      return { error: "Image URL must start with http:// or https://." };
    }
  } catch {
    return { error: "Image URL must be valid." };
  }

  if (!Number.isInteger(inventory) || inventory < 0) {
    return { error: "Inventory must be a whole number greater than or equal to 0." };
  }

  if (!status || !productStatuses.has(status)) {
    return { error: "Choose a valid product status." };
  }

  return {
    product: {
      name,
      description,
      price,
      image_url: imageUrl,
      inventory,
      status,
      updated_at: new Date().toISOString(),
    },
  };
};

const requireCatalogAuthor = async () => {
  if (!isSupabaseConfigured) {
    return { error: "Supabase environment variables are not configured." };
  }

  const session = await getAdminSessionContext();

  if (!session.canAuthorCatalog) {
    return { error: "Only admins and catalog editors can author products." };
  }

  return { session };
};

export async function createProduct(
  _previousState: CatalogActionState,
  formData: FormData,
): Promise<CatalogActionState> {
  const authorization = await requireCatalogAuthor();

  if ("error" in authorization) {
    return { error: authorization.error };
  }

  const parsed = readProductForm(formData);

  if ("error" in parsed) {
    return { error: parsed.error };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("products").insert(parsed.product);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/");
  revalidatePath("/admin/catalog");
  return { success: "Product created." };
}

export async function updateProduct(
  _previousState: CatalogActionState,
  formData: FormData,
): Promise<CatalogActionState> {
  const authorization = await requireCatalogAuthor();

  if ("error" in authorization) {
    return { error: authorization.error };
  }

  const productId = Number(formData.get("productId"));

  if (!Number.isInteger(productId) || productId < 1) {
    return { error: "Product id is invalid." };
  }

  const parsed = readProductForm(formData);

  if ("error" in parsed) {
    return { error: parsed.error };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("products")
    .update(parsed.product)
    .eq("id", productId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/");
  revalidatePath("/admin/catalog");
  return { success: "Product updated." };
}
