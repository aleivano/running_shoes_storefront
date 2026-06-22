"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { CartItem, Product } from "@/lib/types";

export type CreateOrderResult =
  | { ok: true; orderId: string }
  | { ok: false; error: string; reason?: "auth" | "config" | "validation" };

type ProductRow = {
  id: number;
  name: string;
  description: string;
  price: number;
  image_url: string;
  inventory: number;
  status: Product["status"];
};

export async function createOrderFromCart(cart: CartItem[]): Promise<CreateOrderResult> {
  if (!isSupabaseConfigured) {
    return {
      ok: false,
      reason: "config",
      error: "Supabase environment variables are not configured.",
    };
  }

  if (!cart.length) {
    return { ok: false, reason: "validation", error: "Your basket is empty." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, reason: "auth", error: "Sign in to complete checkout." };
  }

  const quantities = new Map<number, number>();
  cart.forEach((item) => {
    quantities.set(item.id, (quantities.get(item.id) ?? 0) + item.quantity);
  });

  const productIds = [...quantities.keys()];
  const { data: products, error: productsError } = await supabase
    .from("products")
    .select("id,name,description,price,image_url,inventory,status")
    .in("id", productIds)
    .eq("status", "active")
    .returns<ProductRow[]>();

  if (productsError) {
    return { ok: false, error: productsError.message };
  }

  if (!products || products.length !== productIds.length) {
    return { ok: false, error: "One or more products are no longer available." };
  }

  const subtotal = products.reduce((sum, product) => {
    const quantity = quantities.get(product.id) ?? 0;
    return sum + product.price * quantity;
  }, 0);
  const shippingTotal = subtotal > 0 ? 0 : 0;
  const taxTotal = 0;
  const total = subtotal + shippingTotal + taxTotal;

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      user_id: user.id,
      status: "pending",
      subtotal,
      shipping_total: shippingTotal,
      tax_total: taxTotal,
      total,
      currency: "USD",
      payment_status: "unpaid",
      shipping_address: {},
    })
    .select("id")
    .single();

  if (orderError || !order) {
    return { ok: false, error: orderError?.message ?? "Could not create order." };
  }

  const orderItems = products.map((product) => {
    const quantity = quantities.get(product.id) ?? 0;

    return {
      order_id: order.id,
      product_id: product.id,
      product_name: product.name,
      product_image_url: product.image_url,
      unit_price: product.price,
      quantity,
      line_total: product.price * quantity,
    };
  });

  const { error: itemsError } = await supabase.from("order_items").insert(orderItems);

  if (itemsError) {
    return { ok: false, error: itemsError.message };
  }

  await supabase.from("order_events").insert({
    order_id: order.id,
    event_type: "created",
    message: "Order created from storefront basket.",
  });

  revalidatePath("/account/orders");
  return { ok: true, orderId: order.id as string };
}

export async function cancelOrder(orderId: string) {
  if (!isSupabaseConfigured) {
    return { error: "Supabase environment variables are not configured." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in to cancel orders." };
  }

  const { error } = await supabase
    .from("orders")
    .update({
      status: "canceled",
      updated_at: new Date().toISOString(),
    })
    .eq("id", orderId)
    .eq("user_id", user.id)
    .in("status", ["pending", "processing"]);

  if (error) {
    return { error: error.message };
  }

  await supabase.from("order_events").insert({
    order_id: orderId,
    event_type: "canceled",
    message: "Order canceled by customer.",
  });

  revalidatePath("/account/orders");
  return { success: true };
}

export async function cancelOrderFromForm(formData: FormData): Promise<void> {
  const orderId = formData.get("orderId")?.toString();

  if (!orderId) {
    return;
  }

  await cancelOrder(orderId);
}
