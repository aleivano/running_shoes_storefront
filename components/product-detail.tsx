"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useSyncExternalStore, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleFavorite } from "@/app/actions/favorites";
import {
  addProductToCart,
  getCartItemCount,
  getServerCartSnapshot,
  getStoredCartSnapshot,
  subscribeToStoredCart,
  writeStoredCart,
} from "@/lib/cart-storage";
import { formatPrice } from "@/lib/format";
import type { Product, ProductColor } from "@/lib/types";

type ProductDetailProps = {
  product: Product;
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

export function ProductDetail({ product, favoriteIds, isSignedIn }: ProductDetailProps) {
  const router = useRouter();
  const cart = useSyncExternalStore(
    subscribeToStoredCart,
    getStoredCartSnapshot,
    getServerCartSnapshot,
  );
  const [favorites, setFavorites] = useState(() => new Set(favoriteIds));
  const [message, setMessage] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState<ProductColor | null>(null);
  const [isPending, startTransition] = useTransition();

  const cartCount = getCartItemCount(cart);
  const isFavorite = favorites.has(product.id);
  const isOutOfStock = product.inventory === 0;
  const canAddToCart = !isOutOfStock && Boolean(selectedSize) && Boolean(selectedColor);
  const displayedImageUrl = selectedColor?.imageUrl ?? product.imageUrl;

  const addToCart = () => {
    if (!canAddToCart) {
      setMessage("Choose a size and color before adding this shoe to your basket.");
      return;
    }

    if (!selectedColor) {
      return;
    }

    writeStoredCart(addProductToCart(cart, product, selectedSize, selectedColor));
    setMessage(`${product.name} in ${selectedColor.name}, size ${selectedSize}, added to basket.`);
  };

  const onToggleFavorite = () => {
    if (!isSignedIn) {
      router.push(`/login?redirectTo=/products/${product.id}`);
      return;
    }

    const nextFavorites = new Set(favorites);
    if (isFavorite) {
      nextFavorites.delete(product.id);
    } else {
      nextFavorites.add(product.id);
    }
    setFavorites(nextFavorites);
    setMessage(null);

    startTransition(async () => {
      const result = await toggleFavorite(product.id, isFavorite);

      if (result?.error) {
        const restoredFavorites = new Set(nextFavorites);
        if (isFavorite) {
          restoredFavorites.add(product.id);
        } else {
          restoredFavorites.delete(product.id);
        }
        setFavorites(restoredFavorites);
        setMessage(result.error);
      }
    });
  };

  return (
    <section className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:py-12">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <Link
          href="/#catalog"
          className="inline-flex rounded-md border border-white/15 px-4 py-3 text-sm font-bold text-neutral-100 transition hover:border-orange-300 hover:text-orange-200"
        >
          Back to catalog
        </Link>
        <Link
          href="/cart"
          aria-label={`Cart with ${cartCount} ${cartCount === 1 ? "item" : "items"}`}
          className="inline-flex items-center gap-3 rounded-md border border-orange-400/60 bg-orange-500/10 px-4 py-3 font-bold text-orange-100 transition hover:border-orange-300 hover:bg-orange-500 hover:text-neutral-950 focus:outline-none focus:ring-2 focus:ring-orange-300"
        >
          Cart
          <span className="rounded-full bg-orange-500 px-2.5 py-1 text-xs font-black text-neutral-950">
            {cartCount}
          </span>
        </Link>
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.95fr)]">
        <div className="relative min-h-[360px] overflow-hidden rounded-lg border border-white/10 bg-neutral-900 shadow-ember sm:min-h-[520px]">
          <Image
            src={displayedImageUrl}
            alt={selectedColor ? `${product.name} in ${selectedColor.name}` : product.name}
            fill
            priority
            sizes="(min-width: 1024px) 54vw, 100vw"
            className="object-cover"
          />
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-orange-300">
                Running shoe
              </p>
              <h1 className="mt-3 text-4xl font-black leading-tight tracking-normal text-white sm:text-5xl">
                {product.name}
              </h1>
            </div>
            <p className="shrink-0 text-3xl font-black text-orange-300">
              {formatPrice(product.price)}
            </p>
          </div>

          <p className="mt-5 text-lg leading-8 text-neutral-300">{product.description}</p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <span
              className={`rounded-full px-3 py-1 text-sm font-black ${
                isOutOfStock
                  ? "bg-red-500/15 text-red-100"
                  : product.inventory <= 10
                    ? "bg-orange-500/15 text-orange-100"
                    : "bg-emerald-500/15 text-emerald-100"
              }`}
            >
              {getStockLabel(product.inventory)}
            </span>
            <span className="rounded-full bg-white/10 px-3 py-1 text-sm font-bold text-neutral-200">
              Free returns within 30 days
            </span>
          </div>

          <div className="mt-7 grid gap-5">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-orange-300">
                Size
              </h2>
              <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-6">
                {product.availableSizes.map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => {
                      setSelectedSize(size);
                      setMessage(null);
                    }}
                    aria-pressed={selectedSize === size}
                    className="rounded-md border border-white/10 bg-neutral-900 px-3 py-3 text-sm font-black text-neutral-100 transition hover:border-orange-300 hover:text-orange-200 aria-pressed:border-orange-300 aria-pressed:bg-orange-500 aria-pressed:text-neutral-950"
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-orange-300">
                Color
              </h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {product.availableColors.map((color) => {
                  const isSelected =
                    selectedColor?.name === color.name && selectedColor.hex === color.hex;

                  return (
                    <button
                      key={`${color.name}-${color.hex}`}
                      type="button"
                      onClick={() => {
                        setSelectedColor(color);
                        setMessage(null);
                      }}
                      aria-pressed={isSelected}
                      className="inline-flex min-w-0 items-center gap-2 rounded-md border border-white/10 bg-neutral-900 px-3 py-3 text-sm font-bold text-neutral-100 transition hover:border-orange-300 hover:text-orange-200 aria-pressed:border-orange-300 aria-pressed:bg-orange-500 aria-pressed:text-neutral-950"
                    >
                      <span
                        aria-hidden="true"
                        className="h-5 w-5 shrink-0 rounded-full border border-white/30"
                        style={{ backgroundColor: color.hex }}
                      />
                      <span className="truncate">{color.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="mt-7 grid gap-3 sm:grid-cols-[1fr_auto]">
            <button
              type="button"
              onClick={addToCart}
              disabled={!canAddToCart}
              className="rounded-md bg-orange-500 px-5 py-4 text-base font-black text-neutral-950 transition hover:bg-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-300 disabled:cursor-not-allowed disabled:bg-neutral-700 disabled:text-neutral-400"
            >
              {isOutOfStock ? "Out of stock" : "Add to basket"}
            </button>
            <button
              type="button"
              onClick={onToggleFavorite}
              disabled={isPending}
              aria-label={isFavorite ? "Remove from favorites" : "Save favorite"}
              className="rounded-md border border-white/15 px-5 py-4 text-base font-black text-orange-100 transition hover:border-orange-300 hover:bg-orange-500 hover:text-neutral-950 disabled:opacity-60"
            >
              {isFavorite ? "Saved" : "Save"}
            </button>
          </div>

          {message ? (
            <p className="mt-4 rounded-md border border-white/10 bg-neutral-900 p-3 text-sm text-neutral-200">
              {message}
            </p>
          ) : null}

          <div className="mt-8 grid gap-5">
            <section className="rounded-lg border border-white/10 bg-neutral-900 p-5">
              <h2 className="text-xl font-black text-white">Sizing</h2>
              <p className="mt-3 text-sm leading-6 text-neutral-300">{product.sizingInfo}</p>
            </section>

            <section className="rounded-lg border border-white/10 bg-neutral-900 p-5">
              <h2 className="text-xl font-black text-white">Fit notes</h2>
              <p className="mt-3 text-sm leading-6 text-neutral-300">{product.fitNotes}</p>
            </section>

            <section className="rounded-lg border border-white/10 bg-neutral-900 p-5">
              <h2 className="text-xl font-black text-white">Specs</h2>
              <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                {product.specs.map((spec) => (
                  <div key={`${spec.label}-${spec.value}`} className="border-t border-white/10 pt-3">
                    <dt className="text-xs font-bold uppercase tracking-[0.14em] text-neutral-500">
                      {spec.label}
                    </dt>
                    <dd className="mt-1 font-bold text-neutral-100">{spec.value}</dd>
                  </div>
                ))}
              </dl>
            </section>
          </div>
        </div>
      </div>
    </section>
  );
}
