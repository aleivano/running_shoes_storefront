import type { CartItem, Product, ProductColor } from "@/lib/types";

export const CART_STORAGE_KEY = "strideforge-cart";
export const CART_UPDATED_EVENT = "strideforge-cart-updated";

const EMPTY_CART: CartItem[] = [];
let lastCartRaw: string | null = null;
let lastCartSnapshot: CartItem[] = EMPTY_CART;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const sanitizeSpecs = (value: unknown) => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((spec) => {
      if (!isRecord(spec) || typeof spec.label !== "string" || typeof spec.value !== "string") {
        return null;
      }

      const label = spec.label.trim();
      const specValue = spec.value.trim();

      if (!label || !specValue) {
        return null;
      }

      return { label, value: specValue };
    })
    .filter((spec): spec is Product["specs"][number] => spec !== null);
};

export const getCartItemCount = (cart: CartItem[]) =>
  cart.reduce((sum, item) => sum + item.quantity, 0);

const normalizeHexColor = (value: string) => value.trim().toUpperCase();

export const getCartLineKey = ({
  id,
  selectedSize,
  selectedColor,
}: {
  id: number;
  selectedSize: string;
  selectedColor: ProductColor;
}) => `${id}:${selectedSize}:${selectedColor.name}:${normalizeHexColor(selectedColor.hex)}`;

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
      const selectedSize =
        typeof item.selectedSize === "string" ? item.selectedSize.trim() : "";

      if (
        !Number.isInteger(id) ||
        !Number.isFinite(price) ||
        !Number.isInteger(inventory) ||
        !Number.isInteger(quantity) ||
        quantity < 1 ||
        typeof item.name !== "string" ||
        typeof item.description !== "string" ||
        typeof item.imageUrl !== "string" ||
        !selectedSize ||
        !isRecord(item.selectedColor) ||
        typeof item.selectedColor.name !== "string" ||
        typeof item.selectedColor.hex !== "string" ||
        (item.status !== "active" && item.status !== "archived")
      ) {
        return null;
      }

      const selectedColorImageUrl =
        typeof item.selectedColor.imageUrl === "string" && item.selectedColor.imageUrl.trim()
          ? item.selectedColor.imageUrl.trim()
          : "";
      const selectedColor = {
        name: item.selectedColor.name.trim(),
        hex: normalizeHexColor(item.selectedColor.hex),
        ...(selectedColorImageUrl ? { imageUrl: selectedColorImageUrl } : {}),
      };

      if (!selectedColor.name || !/^#[0-9A-F]{6}$/.test(selectedColor.hex)) {
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
        sizingInfo: typeof item.sizingInfo === "string" ? item.sizingInfo : "",
        fitNotes: typeof item.fitNotes === "string" ? item.fitNotes : "",
        specs: sanitizeSpecs(item.specs),
        availableSizes: Array.isArray(item.availableSizes)
          ? item.availableSizes
              .map((size) => (typeof size === "string" ? size.trim() : ""))
              .filter(Boolean)
          : [],
        availableColors: Array.isArray(item.availableColors)
          ? item.availableColors
              .map((color) => {
                if (
                  !isRecord(color) ||
                  typeof color.name !== "string" ||
                  typeof color.hex !== "string"
                ) {
                  return null;
                }

                const name = color.name.trim();
                const hex = normalizeHexColor(color.hex);
                const imageUrl =
                  typeof color.imageUrl === "string" && color.imageUrl.trim()
                    ? color.imageUrl.trim()
                    : undefined;

                if (!name || !/^#[0-9A-F]{6}$/.test(hex)) {
                  return null;
                }

                return { name, hex, ...(imageUrl ? { imageUrl } : {}) };
              })
              .filter((color): color is ProductColor => color !== null)
          : [],
        selectedSize,
        selectedColor,
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

export const addProductToCart = (
  cart: CartItem[],
  product: Product,
  selectedSize: string,
  selectedColor: ProductColor,
) => {
  const nextItem = {
    ...product,
    selectedSize,
    selectedColor,
  };
  const nextKey = getCartLineKey(nextItem);
  const current = cart.find((item) => getCartLineKey(item) === nextKey);

  if (current) {
    return cart.map((item) =>
      getCartLineKey(item) === nextKey ? { ...item, quantity: item.quantity + 1 } : item,
    );
  }

  return [...cart, { ...nextItem, quantity: 1 }];
};
