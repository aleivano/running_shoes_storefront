"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import {
  calculateCheckoutTotals,
  processMockPayment,
  validateCheckoutAddress,
  isDeliveryOptionId,
  type CheckoutAddress,
  type MockPaymentInput,
} from "@/lib/checkout";
import type { CartItem, Product } from "@/lib/types";

export type CreateOrderResult =
  | { ok: true; orderId: string }
  | { ok: false; error: string; reason?: "auth" | "config" | "validation" | "payment" };

export type CheckoutOrderInput = {
  cart: CartItem[];
  shippingAddress: CheckoutAddress;
  deliveryOption: string;
  payment: MockPaymentInput;
};

type ProductRow = {
  id: number;
  name: string;
  description: string;
  price: number;
  image_url: string;
  inventory: number;
  status: Product["status"];
  available_sizes: unknown;
  available_colors: unknown;
};

type OrderStatusRow = {
  status: "pending" | "processing" | "shipped" | "delivered" | "canceled";
  payment_status: "unpaid" | "pending" | "paid" | "failed" | "refunded";
};

type AvailableColor = {
  name: string;
  hex: string;
  imageUrl?: string;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const getAvailableColors = (value: unknown) =>
  Array.isArray(value)
    ? value.filter((color): color is AvailableColor => {
        if (
          !isRecord(color) ||
          typeof color.name !== "string" ||
          typeof color.hex !== "string"
        ) {
          return false;
        }

        return typeof color.imageUrl === "undefined" || typeof color.imageUrl === "string";
      })
    : [];

export async function createPaidOrderFromCheckout(
  input: CheckoutOrderInput,
): Promise<CreateOrderResult> {
  if (!isSupabaseConfigured) {
    return {
      ok: false,
      reason: "config",
      error: "Supabase environment variables are not configured.",
    };
  }

  if (!input.cart.length) {
    return { ok: false, reason: "validation", error: "Your basket is empty." };
  }

  if (!isDeliveryOptionId(input.deliveryOption)) {
    return { ok: false, reason: "validation", error: "Choose a valid delivery option." };
  }

  const addressValidation = validateCheckoutAddress(input.shippingAddress);

  if (!addressValidation.ok) {
    return { ok: false, reason: "validation", error: addressValidation.error };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, reason: "auth", error: "Sign in to complete checkout." };
  }

  const quantities = new Map<number, number>();
  for (const item of input.cart) {
    if (
      !Number.isInteger(item.id) ||
      !Number.isInteger(item.quantity) ||
      item.quantity < 1 ||
      !item.selectedSize ||
      !isRecord(item.selectedColor) ||
      typeof item.selectedColor.name !== "string" ||
      typeof item.selectedColor.hex !== "string" ||
      !item.selectedColor.name ||
      !/^#[0-9A-F]{6}$/i.test(item.selectedColor.hex)
    ) {
      return { ok: false, reason: "validation", error: "Your basket contains an invalid item." };
    }

    quantities.set(item.id, (quantities.get(item.id) ?? 0) + item.quantity);
  }

  const productIds = [...quantities.keys()];
  const { data: products, error: productsError } = await supabase
    .from("products")
    .select("id,name,description,price,image_url,inventory,status,available_sizes,available_colors")
    .in("id", productIds)
    .eq("status", "active")
    .returns<ProductRow[]>();

  if (productsError) {
    return { ok: false, error: productsError.message };
  }

  if (!products || products.length !== productIds.length) {
    return { ok: false, error: "One or more products are no longer available." };
  }

  const productsById = new Map(products.map((product) => [product.id, product]));

  for (const item of input.cart) {
    const product = productsById.get(item.id);
    const availableSizes = Array.isArray(product?.available_sizes)
      ? product.available_sizes.filter((size): size is string => typeof size === "string")
      : [];
    const availableColors = getAvailableColors(product?.available_colors);

    const hasSize = availableSizes.includes(item.selectedSize);
    const hasColor = availableColors.some(
      (color) =>
        color.name === item.selectedColor.name &&
        color.hex.toUpperCase() === item.selectedColor.hex.toUpperCase(),
    );

    if (!hasSize || !hasColor) {
      return {
        ok: false,
        reason: "validation",
        error: `${item.name} is no longer available in the selected size or color.`,
      };
    }
  }

  const subtotal = input.cart.reduce((sum, item) => {
    const product = productsById.get(item.id);
    return sum + (product?.price ?? 0) * item.quantity;
  }, 0);

  const unavailableProduct = products.find((product) => {
    const quantity = quantities.get(product.id) ?? 0;
    return product.inventory < quantity;
  });

  if (unavailableProduct) {
    return {
      ok: false,
      reason: "validation",
      error: `${unavailableProduct.name} does not have enough inventory for this order.`,
    };
  }

  const { shippingTotal, taxTotal, total } = calculateCheckoutTotals(
    subtotal,
    input.deliveryOption,
  );

  const paymentResult = processMockPayment(input.payment);

  if (!paymentResult.ok) {
    return { ok: false, reason: "payment", error: paymentResult.error };
  }

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      user_id: user.id,
      status: "processing",
      subtotal,
      shipping_total: shippingTotal,
      tax_total: taxTotal,
      total,
      currency: "USD",
      payment_status: "paid",
      shipping_address: addressValidation.address,
      delivery_option: input.deliveryOption,
      payment_provider: "mock",
      payment_reference: paymentResult.reference,
      payment_method: paymentResult.paymentMethod,
    })
    .select("id")
    .single();

  if (orderError || !order) {
    return { ok: false, error: orderError?.message ?? "Could not create order." };
  }

  const orderItems = input.cart.map((item) => {
    const product = productsById.get(item.id);
    const price = product?.price ?? item.price;
    const selectedProductColor = getAvailableColors(product?.available_colors).find(
      (color) =>
        color.name === item.selectedColor.name &&
        color.hex.toUpperCase() === item.selectedColor.hex.toUpperCase(),
    );

    return {
      order_id: order.id,
      product_id: item.id,
      product_name: product?.name ?? item.name,
      product_image_url: selectedProductColor?.imageUrl ?? product?.image_url ?? item.imageUrl,
      selected_size: item.selectedSize,
      selected_color_name: item.selectedColor.name,
      selected_color_hex: item.selectedColor.hex.toUpperCase(),
      unit_price: price,
      quantity: item.quantity,
      line_total: price * item.quantity,
    };
  });

  const { error: itemsError } = await supabase.from("order_items").insert(orderItems);

  if (itemsError) {
    await supabase
      .from("orders")
      .update({
        status: "canceled",
        payment_status: "failed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", order.id)
      .eq("user_id", user.id)
      .eq("status", "processing");

    await supabase.from("order_events").insert({
      order_id: order.id,
      event_type: "failed",
      message: "Order payment was voided because line items could not be created.",
    });

    revalidatePath("/account/orders");
    return { ok: false, error: itemsError.message };
  }

  await supabase.from("order_events").insert({
    order_id: order.id,
    event_type: "paid",
    message: "Order paid with mock checkout.",
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

  const { data: existingOrder, error: lookupError } = await supabase
    .from("orders")
    .select("status,payment_status")
    .eq("id", orderId)
    .eq("user_id", user.id)
    .in("status", ["pending", "processing"])
    .maybeSingle<OrderStatusRow>();

  if (lookupError) {
    return { error: lookupError.message };
  }

  if (!existingOrder) {
    return { error: "Order is not cancelable." };
  }

  const { error } = await supabase
    .from("orders")
    .update({
      status: "canceled",
      payment_status:
        existingOrder.payment_status === "paid" ? "refunded" : existingOrder.payment_status,
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
