import type { CartItem, Product } from "@/lib/types";

export const CART_STORAGE_KEY = "strideforge-cart";
export const CART_UPDATED_EVENT = "strideforge-cart-updated";

const EMPTY_CART: CartItem[] = [];
let lastCartRaw: string | null = null;
let lastCartSnapshot: CartItem[] = EMPTY_CART;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

export const getCartItemCount = (cart: CartItem[]) =>
  cart.reduce((sum, item) => sum + item.quantity, 0);

export const sanitizeCart = (value: unknown): CartItem[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (!isRecord(item)) {
        return null;
      }

      const id = Number(item.id);
      const price = Number(item.price);
      const inventory = Number(item.inventory);
      const quantity = Number(item.quantity);

      if (
        !Number.isInteger(id) ||
        !Number.isFinite(price) ||
        !Number.isInteger(inventory) ||
        !Number.isInteger(quantity) ||
        quantity < 1 ||
        typeof item.name !== "string" ||
        typeof item.description !== "string" ||
        typeof item.imageUrl !== "string" ||
        (item.status !== "active" && item.status !== "archived")
      ) {
        return null;
      }

      return {
        id,
        name: item.name,
        description: item.description,
        price,
        imageUrl: item.imageUrl,
        inventory,
        status: item.status,
        quantity,
      };
    })
    .filter((item): item is CartItem => item !== null);
};

export const readStoredCart = () => {
  if (typeof window === "undefined") {
    return EMPTY_CART;
  }

  try {
    return sanitizeCart(JSON.parse(window.localStorage.getItem(CART_STORAGE_KEY) ?? "[]"));
  } catch {
    return [];
  }
};

export const getStoredCartSnapshot = () => {
  if (typeof window === "undefined") {
    return EMPTY_CART;
  }

  const raw = window.localStorage.getItem(CART_STORAGE_KEY) ?? "[]";

  if (raw === lastCartRaw) {
    return lastCartSnapshot;
  }

  lastCartRaw = raw;
  try {
    lastCartSnapshot = sanitizeCart(JSON.parse(raw));
  } catch {
    lastCartSnapshot = EMPTY_CART;
  }

  return lastCartSnapshot;
};

export const getServerCartSnapshot = () => EMPTY_CART;

export const subscribeToStoredCart = (listener: () => void) => {
  if (typeof window === "undefined") {
    return () => {};
  }

  window.addEventListener("storage", listener);
  window.addEventListener(CART_UPDATED_EVENT, listener);

  return () => {
    window.removeEventListener("storage", listener);
    window.removeEventListener(CART_UPDATED_EVENT, listener);
  };
};

export const writeStoredCart = (cart: CartItem[]) => {
  if (typeof window === "undefined") {
    return;
  }

  const raw = JSON.stringify(cart);
  lastCartRaw = raw;
  lastCartSnapshot = cart;
  window.localStorage.setItem(CART_STORAGE_KEY, raw);
  window.dispatchEvent(new Event(CART_UPDATED_EVENT));
};

export const addProductToCart = (cart: CartItem[], product: Product) => {
  const current = cart.find((item) => item.id === product.id);

  if (current) {
    return cart.map((item) =>
      item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item,
    );
  }

  return [...cart, { ...product, quantity: 1 }];
};
