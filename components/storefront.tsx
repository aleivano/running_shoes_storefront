"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleFavorite } from "@/app/actions/favorites";
import {
  getCartItemCount,
  getServerCartSnapshot,
  getStoredCartSnapshot,
  subscribeToStoredCart,
} from "@/lib/cart-storage";
import { formatPrice } from "@/lib/format";
import type { Product, ProductColor } from "@/lib/types";

type StorefrontProps = {
  products: Product[];
  favoriteIds: number[];
  isSignedIn: boolean;
};

const getStockLabel = (inventory: number) => {
  if (inventory === 0) {
    return "Out of stock";
  }

  if (inventory <= 10) {
    return `Low stock: ${inventory} left`;
  }

  return "In stock";
};

function ColorSwatches({ colors }: { colors: ProductColor[] }) {
  const rowRef = useRef<HTMLDivElement>(null);
  const [visibleCount, setVisibleCount] = useState(colors.length);

  useEffect(() => {
    const row = rowRef.current;

    if (!row) {
      return;
    }

    const updateVisibleCount = () => {
      const swatchWidth = 22;
      const gap = 8;
      const availableWidth = row.clientWidth;
      const nextVisibleCount = Math.max(
        1,
        Math.min(colors.length, Math.floor((availableWidth + gap) / (swatchWidth + gap))),
      );

      setVisibleCount(nextVisibleCount);
    };

    updateVisibleCount();
    const observer = new ResizeObserver(updateVisibleCount);
    observer.observe(row);

    return () => observer.disconnect();
  }, [colors.length]);

  return (
    <div ref={rowRef} className="mt-4 flex min-h-[22px] min-w-0 gap-2 overflow-hidden">
      {colors.slice(0, visibleCount).map((color) => (
        <span
          key={`${color.name}-${color.hex}`}
          title={color.name}
          aria-label={color.name}
          className="h-[22px] w-[22px] shrink-0 rounded-full border border-white/30"
          style={{ backgroundColor: color.hex }}
        />
      ))}
    </div>
  );
}

export function Storefront({ products, favoriteIds, isSignedIn }: StorefrontProps) {
  const router = useRouter();
  const cart = useSyncExternalStore(
    subscribeToStoredCart,
    getStoredCartSnapshot,
    getServerCartSnapshot,
  );
  const [favorites, setFavorites] = useState(() => new Set(favoriteIds));
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const cartCount = getCartItemCount(cart);

  const onToggleFavorite = (productId: number) => {
    if (!isSignedIn) {
      router.push("/login?redirectTo=/");
      return;
    }

    const isFavorite = favorites.has(productId);
    const nextFavorites = new Set(favorites);
    if (isFavorite) {
      nextFavorites.delete(productId);
    } else {
      nextFavorites.add(productId);
    }
    setFavorites(nextFavorites);

    startTransition(async () => {
      const result = await toggleFavorite(productId, isFavorite);

      if (result?.error) {
        const restoredFavorites = new Set(nextFavorites);
        if (isFavorite) {
          restoredFavorites.add(productId);
        } else {
          restoredFavorites.delete(productId);
        }
        setFavorites(restoredFavorites);
        setMessage(result.error);
      }
    });
  };

  return (
    <>
      <section className="relative overflow-hidden border-b border-white/10 bg-neutral-950">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_10%,rgba(249,115,22,0.28),transparent_34%),linear-gradient(135deg,rgba(24,24,27,0.2),rgba(8,8,8,1))]" />
        <div className="relative mx-auto grid min-h-[78vh] max-w-7xl items-center gap-10 px-5 py-10 sm:px-8 lg:grid-cols-[1fr_0.95fr] lg:py-14">
          <div className="max-w-2xl">
            <p className="mb-4 inline-flex rounded-full border border-orange-400/40 bg-orange-500/10 px-4 py-2 text-sm font-semibold text-orange-200">
              Summer Sale: up to 35% off selected runners
            </p>
            <h1 className="text-5xl font-black leading-none tracking-normal text-white sm:text-6xl lg:text-7xl">
              StrideForge Running Shoes
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-neutral-300">
              Road, trail, race day, and recovery shoes selected for runners who
              want speed, comfort, and durable performance.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="#catalog"
                className="inline-flex rounded-md bg-orange-500 px-6 py-3 text-base font-bold text-neutral-950 shadow-ember transition hover:bg-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-300"
              >
                Shop the sale
              </a>
              {isSignedIn ? (
                <Link
                  href="/account/orders"
                  className="inline-flex rounded-md border border-white/15 px-6 py-3 text-base font-bold text-neutral-100 transition hover:border-orange-300 hover:text-orange-200"
                >
                  View orders
                </Link>
              ) : null}
            </div>
          </div>
          <div className="relative min-h-[340px] overflow-hidden rounded-lg border border-white/10 bg-neutral-900 shadow-ember">
            <Image
              src="https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=1200&q=85"
              alt="Orange running shoe on a dark background"
              fill
              priority
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-neutral-950 via-neutral-950/70 to-transparent p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-orange-300">
                Fast delivery
              </p>
              <p className="mt-2 text-2xl font-bold">Built for the next run</p>
            </div>
          </div>
        </div>
      </section>

      <section
        id="catalog"
        className="mx-auto grid max-w-7xl gap-8 px-5 py-10 sm:px-8 lg:py-14"
      >
        <div className="min-w-0">
          <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-orange-300">
                Catalog
              </p>
              <h2 className="text-3xl font-black tracking-normal text-white">
                Running shoes
              </h2>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-sm text-neutral-400">{products.length} models available</p>
              <Link
                href="/cart"
                aria-label={`Cart with ${cartCount} ${cartCount === 1 ? "item" : "items"}`}
                className="inline-flex items-center gap-3 rounded-md border border-orange-400/60 bg-orange-500/10 px-4 py-3 font-bold text-orange-100 transition hover:border-orange-300 hover:bg-orange-500 hover:text-neutral-950 focus:outline-none focus:ring-2 focus:ring-orange-300"
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                >
                  <circle cx="8" cy="21" r="1" />
                  <circle cx="19" cy="21" r="1" />
                  <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
                </svg>
                <span>Cart</span>
                <span className="rounded-full bg-orange-500 px-2.5 py-1 text-xs font-black text-neutral-950">
                  {cartCount}
                </span>
              </Link>
            </div>
          </div>
          {message ? (
            <p className="mb-5 rounded-md border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-100">
              {message}
            </p>
          ) : null}

          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {products.map((product) => {
              const isFavorite = favorites.has(product.id);
              return (
                <article
                  key={product.id}
                  className="overflow-hidden rounded-lg border border-white/10 bg-neutral-900 shadow-lg shadow-black/25"
                >
                  <Link
                    href={`/products/${product.id}`}
                    className="block aspect-[4/3] overflow-hidden bg-neutral-800"
                  >
                    <Image
                      src={product.imageUrl}
                      alt={product.name}
                      width={900}
                      height={675}
                      sizes="(min-width: 1280px) 26vw, (min-width: 640px) 45vw, 100vw"
                      className="h-full w-full object-cover transition duration-300 hover:scale-105"
                    />
                  </Link>
                  <div className="flex min-h-[250px] flex-col p-5">
                    <div className="flex items-start justify-between gap-4">
                      <h3 className="text-xl font-bold text-white">
                        <Link
                          href={`/products/${product.id}`}
                          className="transition hover:text-orange-200"
                        >
                          {product.name}
                        </Link>
                      </h3>
                      <p className="shrink-0 text-lg font-black text-orange-300">
                        {formatPrice(product.price)}
                      </p>
                    </div>
                    <p className="mt-3 flex-1 text-sm leading-6 text-neutral-300">
                      {product.description}
                    </p>
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-black ${
                          product.inventory <= 10
                              ? "bg-orange-500/15 text-orange-100"
                              : "bg-emerald-500/15 text-emerald-100"
                        }`}
                      >
                        {getStockLabel(product.inventory)}
                      </span>
                      <Link
                        href={`/products/${product.id}`}
                        className="text-xs font-bold text-neutral-400 transition hover:text-orange-200"
                      >
                        View details
                      </Link>
                    </div>
                    <ColorSwatches colors={product.availableColors} />
                    <div className="mt-5 grid grid-cols-[1fr_auto] gap-3">
                      <Link
                        href={`/products/${product.id}`}
                        className="rounded-md border border-orange-400/60 bg-orange-500/10 px-4 py-3 text-center text-sm font-bold text-orange-100 transition hover:border-orange-300 hover:bg-orange-500 hover:text-neutral-950 focus:outline-none focus:ring-2 focus:ring-orange-300"
                      >
                        Choose options
                      </Link>
                      <button
                        type="button"
                        onClick={() => onToggleFavorite(product.id)}
                        disabled={isPending}
                        aria-label={isFavorite ? "Remove from favorites" : "Save favorite"}
                        className="rounded-md border border-white/15 px-4 py-3 text-lg font-black text-orange-200 transition hover:border-orange-300 hover:bg-orange-500 hover:text-neutral-950 disabled:opacity-60"
                      >
                        {isFavorite ? "Saved" : "Save"}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}
