import type { Product } from "@/lib/types";

export type StockState =
  | { kind: "out"; label: "Out of stock" }
  | { kind: "low"; label: string }
  | { kind: "available"; label: null };

export const getStockState = (product: Pick<Product, "inventory" | "lowStockThreshold">): StockState => {
  if (product.inventory === 0) {
    return { kind: "out", label: "Out of stock" };
  }

  if (product.lowStockThreshold > 0 && product.inventory < product.lowStockThreshold) {
    return { kind: "low", label: `low on stock: ${product.inventory}` };
  }

  return { kind: "available", label: null };
};
