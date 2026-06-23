import { fallbackProducts } from "@/lib/catalog";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import type { AppRole, Order, OrderItem, Product, Profile } from "@/lib/types";

type ProductRow = {
  id: number;
  name: string;
  description: string;
  price: number;
  image_url: string;
  inventory: number;
  status: Product["status"];
};

type ProfileRow = {
  id: string;
  email: string;
  username: string;
  display_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  role: AppRole;
  created_at: string;
  updated_at: string;
};

type OrderItemRow = {
  id: string;
  order_id: string;
  product_id: number | null;
  product_name: string;
  product_image_url: string;
  unit_price: number;
  quantity: number;
  line_total: number;
};

type OrderRow = {
  id: string;
  user_id: string;
  status: Order["status"];
  subtotal: number;
  shipping_total: number;
  tax_total: number;
  total: number;
  currency: string;
  payment_status: Order["paymentStatus"];
  shipping_address: Record<string, unknown>;
  delivery_option: Order["deliveryOption"];
  payment_provider: string;
  payment_reference: string | null;
  payment_method: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  order_items?: OrderItemRow[];
};

export const mapProduct = (row: ProductRow): Product => ({
  id: row.id,
  name: row.name,
  description: row.description,
  price: row.price,
  imageUrl: row.image_url,
  inventory: row.inventory,
  status: row.status,
});

export const mapProfile = (row: ProfileRow): Profile => ({
  id: row.id,
  email: row.email,
  username: row.username,
  displayName: row.display_name,
  phone: row.phone,
  avatarUrl: row.avatar_url,
  role: row.role,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const canManageUsers = (profile: Profile | null) => profile?.role === "admin";

export const canAuthorCatalog = (profile: Profile | null) =>
  profile?.role === "admin" || profile?.role === "catalog_editor";

const mapOrderItem = (row: OrderItemRow): OrderItem => ({
  id: row.id,
  orderId: row.order_id,
  productId: row.product_id,
  productName: row.product_name,
  productImageUrl: row.product_image_url,
  unitPrice: row.unit_price,
  quantity: row.quantity,
  lineTotal: row.line_total,
});

const mapOrder = (row: OrderRow): Order => ({
  id: row.id,
  userId: row.user_id,
  status: row.status,
  subtotal: row.subtotal,
  shippingTotal: row.shipping_total,
  taxTotal: row.tax_total,
  total: row.total,
  currency: row.currency,
  paymentStatus: row.payment_status,
  shippingAddress: row.shipping_address,
  deliveryOption: row.delivery_option,
  paymentProvider: row.payment_provider,
  paymentReference: row.payment_reference,
  paymentMethod: row.payment_method,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  items: row.order_items?.map(mapOrderItem) ?? [],
});

export async function getProducts() {
  if (!isSupabaseConfigured) {
    return fallbackProducts;
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("products")
      .select("id,name,description,price,image_url,inventory,status")
      .eq("status", "active")
      .order("id")
      .returns<ProductRow[]>();

    if (error || !data?.length) {
      return fallbackProducts;
    }

    return data.map(mapProduct);
  } catch {
    return fallbackProducts;
  }
}

export async function getSessionContext() {
  if (!isSupabaseConfigured) {
    return {
      userId: null,
      email: null,
      profile: null,
      favoriteIds: [] as number[],
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      userId: null,
      email: null,
      profile: null,
      favoriteIds: [] as number[],
    };
  }

  const [{ data: profile }, { data: favorites }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id,email,username,display_name,phone,avatar_url,role,created_at,updated_at")
      .eq("id", user.id)
      .maybeSingle<ProfileRow>(),
    supabase.from("favorites").select("product_id").eq("user_id", user.id),
  ]);

  return {
    userId: user.id,
    email: user.email ?? null,
    profile: profile ? mapProfile(profile) : null,
    favoriteIds: favorites?.map((favorite) => favorite.product_id as number) ?? [],
  };
}

export async function getOrders() {
  if (!isSupabaseConfigured) {
    return [] as Order[];
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select(
      "id,user_id,status,subtotal,shipping_total,tax_total,total,currency,payment_status,shipping_address,delivery_option,payment_provider,payment_reference,payment_method,created_at,updated_at,order_items(*)",
    )
    .order("created_at", { ascending: false })
    .returns<OrderRow[]>();

  if (error || !data) {
    return [];
  }

  return data.map(mapOrder);
}

export async function getFavoriteProducts() {
  if (!isSupabaseConfigured) {
    return [] as Product[];
  }

  const supabase = await createClient();
  const { data: favorites, error: favoritesError } = await supabase
    .from("favorites")
    .select("product_id")
    .order("created_at", { ascending: false });

  if (favoritesError || !favorites?.length) {
    return [];
  }

  const productIds = favorites.map((favorite) => favorite.product_id as number);
  const { data: products, error: productsError } = await supabase
    .from("products")
    .select("id,name,description,price,image_url,inventory,status")
    .in("id", productIds)
    .eq("status", "active")
    .returns<ProductRow[]>();

  if (productsError || !products) {
    return [];
  }

  const productsById = new Map(products.map((product) => [product.id, mapProduct(product)]));

  return productIds
    .map((productId) => productsById.get(productId))
    .filter((product): product is Product => Boolean(product));
}

export async function getAdminSessionContext() {
  const session = await getSessionContext();

  return {
    ...session,
    canManageUsers: canManageUsers(session.profile),
    canAuthorCatalog: canAuthorCatalog(session.profile),
  };
}

export async function getAdminUsers() {
  if (!isSupabaseConfigured) {
    return [] as Profile[];
  }

  const session = await getAdminSessionContext();

  if (!session.canManageUsers) {
    return [] as Profile[];
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id,email,username,display_name,phone,avatar_url,role,created_at,updated_at")
    .order("created_at", { ascending: false })
    .returns<ProfileRow[]>();

  if (error || !data) {
    return [] as Profile[];
  }

  return data.map(mapProfile);
}

export async function getAdminProducts() {
  if (!isSupabaseConfigured) {
    return fallbackProducts;
  }

  const session = await getAdminSessionContext();

  if (!session.canAuthorCatalog) {
    return [] as Product[];
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("id,name,description,price,image_url,inventory,status")
    .order("id")
    .returns<ProductRow[]>();

  if (error || !data) {
    return [] as Product[];
  }

  return data.map(mapProduct);
}
