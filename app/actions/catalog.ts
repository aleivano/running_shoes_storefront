"use server";

import { revalidatePath } from "next/cache";
import { getAdminSessionContext } from "@/lib/data";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import type { ProductColor, ProductSpec, ProductStatus } from "@/lib/types";

export type CatalogActionState = {
  error?: string;
  success?: string;
};

const productStatuses = new Set<ProductStatus>(["active", "archived"]);

const parseSpecs = (value: string) => {
  const specs = value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const separatorIndex = line.indexOf(":");

      if (separatorIndex < 1) {
        return null;
      }

      const label = line.slice(0, separatorIndex).trim();
      const specValue = line.slice(separatorIndex + 1).trim();

      if (!label || !specValue) {
        return null;
      }

      return { label, value: specValue };
    });

  if (specs.some((spec) => spec === null)) {
    return { error: "Specs must use one Label: Value pair per line." };
  }

  if (specs.length < 1) {
    return { error: "Add at least one product spec." };
  }

  return { specs: specs as ProductSpec[] };
};

const parseSizes = (value: string) => {
  const sizes = value
    .split(/[\n,]/)
    .map((size) => size.trim())
    .filter(Boolean);

  const uniqueSizes = [...new Set(sizes)];

  if (uniqueSizes.length < 1) {
    return { error: "Add at least one available size." };
  }

  return { sizes: uniqueSizes };
};

const parseColors = (value: string) => {
  const colors = value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const separatorIndex = line.indexOf(":");

      if (separatorIndex < 1) {
        return null;
      }

      const name = line.slice(0, separatorIndex).trim();
      const [rawHex = "", rawImageUrl = ""] = line.slice(separatorIndex + 1).split("|");
      const hex = rawHex.trim().toUpperCase();
      const imageUrl = rawImageUrl.trim();

      if (!name || !/^#[0-9A-F]{6}$/.test(hex)) {
        return null;
      }

      if (imageUrl) {
        try {
          const parsedUrl = new URL(imageUrl);

          if (!["http:", "https:"].includes(parsedUrl.protocol)) {
            return null;
          }
        } catch {
          return null;
        }
      }

      return { name, hex, ...(imageUrl ? { imageUrl } : {}) };
    });

  if (colors.some((color) => color === null)) {
    return { error: "Colors must use one Name: #RRGGBB | Image URL pair per line." };
  }

  if (colors.length < 1) {
    return { error: "Add at least one available color." };
  }

  return { colors: colors as ProductColor[] };
};

const readProductForm = (formData: FormData) => {
  const name = formData.get("name")?.toString().trim() ?? "";
  const description = formData.get("description")?.toString().trim() ?? "";
  const price = Number(formData.get("price"));
  const imageUrl = formData.get("imageUrl")?.toString().trim() ?? "";
  const inventory = Number(formData.get("inventory"));
  const lowStockThreshold = Number(formData.get("lowStockThreshold"));
  const status = formData.get("status")?.toString() as ProductStatus | undefined;
  const sizingInfo = formData.get("sizingInfo")?.toString().trim() ?? "";
  const fitNotes = formData.get("fitNotes")?.toString().trim() ?? "";
  const parsedSpecs = parseSpecs(formData.get("specs")?.toString() ?? "");
  const parsedSizes = parseSizes(formData.get("availableSizes")?.toString() ?? "");
  const parsedColors = parseColors(formData.get("availableColors")?.toString() ?? "");

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

  if (!Number.isInteger(lowStockThreshold) || lowStockThreshold < 0) {
    return { error: "Low stock threshold must be a whole number greater than or equal to 0." };
  }

  if (!status || !productStatuses.has(status)) {
    return { error: "Choose a valid product status." };
  }

  if (sizingInfo.length < 12) {
    return { error: "Sizing info must be at least 12 characters." };
  }

  if (fitNotes.length < 12) {
    return { error: "Fit notes must be at least 12 characters." };
  }

  if ("error" in parsedSpecs) {
    return { error: parsedSpecs.error };
  }

  if ("error" in parsedSizes) {
    return { error: parsedSizes.error };
  }

  if ("error" in parsedColors) {
    return { error: parsedColors.error };
  }

  return {
    product: {
      name,
      description,
      price,
      image_url: imageUrl,
      inventory,
      low_stock_threshold: lowStockThreshold,
      status,
      sizing_info: sizingInfo,
      fit_notes: fitNotes,
      specs: parsedSpecs.specs,
      available_sizes: parsedSizes.sizes,
      available_colors: parsedColors.colors,
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
  revalidatePath("/products");
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
  revalidatePath(`/products/${productId}`);
  revalidatePath("/admin/catalog");
  return { success: "Product updated." };
}
