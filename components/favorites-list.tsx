"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState, useSyncExternalStore, useTransition } from "react";
import { toggleFavorite } from "@/app/actions/favorites";
import {
  getCartItemCount,
  getServerCartSnapshot,
  getStoredCartSnapshot,
  subscribeToStoredCart,
} from "@/lib/cart-storage";
import { formatPrice } from "@/lib/format";
import { getStockState } from "@/lib/stock";
import type { Product } from "@/lib/types";

export function FavoritesList({ products }: { products: Product[] }) {
  const [favorites, setFavorites] = useState(products);
  const cart = useSyncExternalStore(
    subscribeToStoredCart,
    getStoredCartSnapshot,
    getServerCartSnapshot,
  );
  const [isPending, startTransition] = useTransition();
  const total = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cart],
  );

  const removeFavorite = (productId: number) => {
    setFavorites((items) => items.filter((item) => item.id !== productId));
    startTransition(() => {
      void toggleFavorite(productId, true);
    });
  };

  if (!favorites.length) {
    return (
      <div className="rounded-lg border border-white/10 bg-neutral-900 p-6">
        <p className="text-neutral-300">No favorites saved yet.</p>
        <Link
          href="/#catalog"
          className="mt-5 inline-flex rounded-md bg-orange-500 px-5 py-3 font-bold text-neutral-950 hover:bg-orange-400"
        >
          Browse catalog
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="grid gap-5 sm:grid-cols-2">
        {favorites.map((product) => {
          const stockState = getStockState(product);

          return (
            <article
              key={product.id}
              className="overflow-hidden rounded-lg border border-white/10 bg-neutral-900"
            >
              <Link href={`/products/${product.id}`} className="block overflow-hidden">
                <Image
                  src={product.imageUrl}
                  alt={product.name}
                  width={900}
                  height={675}
                  sizes="(min-width: 1024px) 35vw, 100vw"
                  className="aspect-[4/3] w-full object-cover transition duration-300 hover:scale-105"
                />
              </Link>
              <div className="grid gap-4 p-5">
                <div className="flex items-start justify-between gap-4">
                  <h2 className="text-xl font-bold text-white">
                    <Link
                      href={`/products/${product.id}`}
                      className="transition hover:text-orange-200"
                    >
                      {product.name}
                    </Link>
                  </h2>
                  <p className="font-black text-orange-300">{formatPrice(product.price)}</p>
                </div>
                <p className="text-sm leading-6 text-neutral-300">{product.description}</p>
                <div className="flex flex-wrap items-center gap-2">
                  {stockState.label ? (
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-black ${
                        stockState.kind === "out"
                          ? "bg-red-500/15 text-red-100"
                          : "bg-orange-500/15 text-orange-100"
                      }`}
                    >
                      {stockState.label}
                    </span>
                  ) : null}
                  <Link
                    href={`/products/${product.id}`}
                    className="text-xs font-bold text-neutral-400 transition hover:text-orange-200"
                  >
                    View details
                  </Link>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Link
                    href={`/products/${product.id}`}
                    className="rounded-md bg-orange-500 px-4 py-3 text-center text-sm font-black text-neutral-950 hover:bg-orange-400"
                  >
                    Choose options
                  </Link>
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => removeFavorite(product.id)}
                    className="rounded-md border border-white/15 px-4 py-3 text-sm font-bold text-neutral-100 hover:border-orange-300 hover:text-orange-200 disabled:opacity-60"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
      <aside className="h-fit rounded-lg border border-white/10 bg-neutral-900 p-5">
        <h2 className="text-2xl font-black text-white">Favorites basket</h2>
        <p className="mt-3 text-sm text-neutral-400">
          Choose size and color from each product page before checkout.
        </p>
        <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-5">
          <span className="font-semibold text-neutral-200">
            {getCartItemCount(cart)} items
          </span>
          <span className="text-xl font-black text-orange-300">{formatPrice(total)}</span>
        </div>
        <Link
          href="/#catalog"
          className="mt-5 inline-flex w-full justify-center rounded-md bg-orange-500 px-5 py-3 font-black text-neutral-950 hover:bg-orange-400"
        >
          Continue shopping
        </Link>
      </aside>
    </div>
  );
}
