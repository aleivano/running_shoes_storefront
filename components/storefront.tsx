"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createOrderFromCart } from "@/app/actions/orders";
import { toggleFavorite } from "@/app/actions/favorites";
import { formatPrice } from "@/lib/format";
import type { CartItem, Product } from "@/lib/types";

type StorefrontProps = {
  products: Product[];
  favoriteIds: number[];
  isSignedIn: boolean;
};

export function Storefront({ products, favoriteIds, isSignedIn }: StorefrontProps) {
  const router = useRouter();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [favorites, setFavorites] = useState(() => new Set(favoriteIds));
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const total = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cart],
  );

  const addToCart = (product: Product) => {
    setCart((items) => {
      const current = items.find((item) => item.id === product.id);

      if (current) {
        return items.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item,
        );
      }

      return [...items, { ...product, quantity: 1 }];
    });
  };

  const submitOrder = () => {
    if (!cart.length) {
      return;
    }

    if (!isSignedIn) {
      router.push("/login?redirectTo=/");
      return;
    }

    setMessage(null);
    startTransition(async () => {
      const result = await createOrderFromCart(cart);

      if (result.ok) {
        setCart([]);
        router.push(`/account/orders?created=${result.orderId}`);
        return;
      }

      if (result.reason === "auth") {
        router.push("/login?redirectTo=/");
        return;
      }

      setMessage(result.error);
    });
  };

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
        className="mx-auto grid max-w-7xl gap-8 px-5 py-10 sm:px-8 lg:grid-cols-[1fr_360px] lg:py-14"
      >
        <div>
          <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-orange-300">
                Catalog
              </p>
              <h2 className="text-3xl font-black tracking-normal text-white">
                Running shoes
              </h2>
            </div>
            <p className="text-sm text-neutral-400">{products.length} models available</p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {products.map((product) => {
              const isFavorite = favorites.has(product.id);

              return (
                <article
                  key={product.id}
                  className="overflow-hidden rounded-lg border border-white/10 bg-neutral-900 shadow-lg shadow-black/25"
                >
                  <div className="aspect-[4/3] overflow-hidden bg-neutral-800">
                    <Image
                      src={product.imageUrl}
                      alt={product.name}
                      width={900}
                      height={675}
                      sizes="(min-width: 1280px) 26vw, (min-width: 640px) 45vw, 100vw"
                      className="h-full w-full object-cover transition duration-300 hover:scale-105"
                    />
                  </div>
                  <div className="flex min-h-[250px] flex-col p-5">
                    <div className="flex items-start justify-between gap-4">
                      <h3 className="text-xl font-bold text-white">{product.name}</h3>
                      <p className="shrink-0 text-lg font-black text-orange-300">
                        {formatPrice(product.price)}
                      </p>
                    </div>
                    <p className="mt-3 flex-1 text-sm leading-6 text-neutral-300">
                      {product.description}
                    </p>
                    <div className="mt-5 grid grid-cols-[1fr_auto] gap-3">
                      <button
                        type="button"
                        onClick={() => addToCart(product)}
                        className="rounded-md border border-orange-400/60 bg-orange-500/10 px-4 py-3 text-sm font-bold text-orange-100 transition hover:border-orange-300 hover:bg-orange-500 hover:text-neutral-950 focus:outline-none focus:ring-2 focus:ring-orange-300"
                      >
                        Add to basket
                      </button>
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

        <aside className="h-fit rounded-lg border border-white/10 bg-neutral-900 p-5 shadow-lg shadow-black/25 lg:sticky lg:top-6">
          <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-4">
            <h2 className="text-2xl font-black tracking-normal">Shopping basket</h2>
            <span className="rounded-full bg-orange-500 px-3 py-1 text-sm font-bold text-neutral-950">
              {cart.reduce((sum, item) => sum + item.quantity, 0)}
            </span>
          </div>

          {cart.length === 0 ? (
            <p className="py-8 text-sm leading-6 text-neutral-400">
              Your basket is empty. Add shoes from the catalog to see prices and
              the order total here.
            </p>
          ) : (
            <ul className="divide-y divide-white/10">
              {cart.map((item) => (
                <li key={item.id} className="flex gap-4 py-4">
                  <Image
                    src={item.imageUrl}
                    alt={item.name}
                    width={64}
                    height={64}
                    sizes="64px"
                    className="h-16 w-16 rounded-md object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-white">{item.name}</p>
                    <p className="mt-1 text-sm text-neutral-400">
                      {item.quantity} x {formatPrice(item.price)}
                    </p>
                  </div>
                  <p className="font-bold text-orange-300">
                    {formatPrice(item.price * item.quantity)}
                  </p>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-5 border-t border-white/10 pt-5">
            <div className="flex items-center justify-between text-lg">
              <span className="font-semibold text-neutral-200">Total</span>
              <span className="text-2xl font-black text-orange-300">
                {formatPrice(total)}
              </span>
            </div>
            {message ? (
              <p className="mt-4 rounded-md border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-100">
                {message}
              </p>
            ) : null}
            <button
              type="button"
              onClick={submitOrder}
              disabled={!cart.length || isPending}
              className="mt-5 w-full rounded-md bg-orange-500 px-5 py-3 font-black text-neutral-950 transition hover:bg-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-300 disabled:cursor-not-allowed disabled:bg-neutral-700 disabled:text-neutral-400"
            >
              {isPending ? "Processing..." : isSignedIn ? "Buy" : "Log in to buy"}
            </button>
          </div>
        </aside>
      </section>
    </>
  );
}
