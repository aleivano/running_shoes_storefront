"use client";

import Image from "next/image";
import Link from "next/link";
import {
  type ChangeEvent,
  useMemo,
  useState,
  useSyncExternalStore,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";
import { createPaidOrderFromCheckout } from "@/app/actions/orders";
import {
  DELIVERY_OPTIONS,
  EMPTY_CHECKOUT_ADDRESS,
  EMPTY_MOCK_PAYMENT,
  FREE_STANDARD_SHIPPING_THRESHOLD,
  calculateCartSubtotal,
  calculateCheckoutTotals,
  type CheckoutAddress,
  type DeliveryOptionId,
  type MockPaymentInput,
} from "@/lib/checkout";
import {
  getCartLineKey,
  getCartItemCount,
  getServerCartSnapshot,
  getStoredCartSnapshot,
  subscribeToStoredCart,
  writeStoredCart,
} from "@/lib/cart-storage";
import { formatPrice } from "@/lib/format";
import type { CartItem, Product } from "@/lib/types";

type CartPageProps = {
  products: Product[];
  isSignedIn: boolean;
};

export function CartPage({ products, isSignedIn }: CartPageProps) {
  const router = useRouter();
  const cart = useSyncExternalStore(
    subscribeToStoredCart,
    getStoredCartSnapshot,
    getServerCartSnapshot,
  );
  const [message, setMessage] = useState<string | null>(null);
  const [shippingAddress, setShippingAddress] = useState<CheckoutAddress>({
    ...EMPTY_CHECKOUT_ADDRESS,
  });
  const [deliveryOption, setDeliveryOption] = useState<DeliveryOptionId>("standard");
  const [payment, setPayment] = useState<MockPaymentInput>({ ...EMPTY_MOCK_PAYMENT });
  const [isPending, startTransition] = useTransition();

  const availableCart = useMemo(() => {
    const productsById = new Map(products.map((product) => [product.id, product]));

    return cart
      .map((item) => {
        const product = productsById.get(item.id);

        if (!product) {
          return null;
        }

        const selectedColor = product.availableColors.find(
          (color) =>
            color.name === item.selectedColor.name &&
            color.hex.toUpperCase() === item.selectedColor.hex.toUpperCase(),
        );

        if (!product.availableSizes.includes(item.selectedSize) || !selectedColor) {
          return null;
        }

        return {
          ...product,
          imageUrl: selectedColor.imageUrl ?? product.imageUrl,
          selectedSize: item.selectedSize,
          selectedColor,
          quantity: item.quantity,
        };
      })
      .filter((item): item is CartItem => item !== null);
  }, [cart, products]);

  const cartCount = getCartItemCount(availableCart);
  const quantitiesByProduct = useMemo(() => {
    const quantities = new Map<number, number>();

    for (const item of availableCart) {
      quantities.set(item.id, (quantities.get(item.id) ?? 0) + item.quantity);
    }

    return quantities;
  }, [availableCart]);
  const overstockedItem = availableCart.find(
    (item) => (quantitiesByProduct.get(item.id) ?? 0) > item.inventory,
  );
  const stockWarning = overstockedItem
    ? `${overstockedItem.name} only has ${overstockedItem.inventory} available.`
    : null;
  const subtotal = useMemo(() => calculateCartSubtotal(availableCart), [availableCart]);
  const totals = useMemo(
    () => calculateCheckoutTotals(subtotal, deliveryOption),
    [deliveryOption, subtotal],
  );

  const updateCart = (nextCart: CartItem[]) => {
    writeStoredCart(nextCart);
  };

  const updateQuantity = (lineKey: string, quantity: number) => {
    const currentLine = availableCart.find((item) => getCartLineKey(item) === lineKey);

    if (currentLine && quantity > currentLine.quantity) {
      const productQuantity = quantitiesByProduct.get(currentLine.id) ?? currentLine.quantity;

      if (productQuantity >= currentLine.inventory) {
        setMessage(`${currentLine.name} only has ${currentLine.inventory} available.`);
        return;
      }
    }

    setMessage(null);
    const nextCart = cart
      .map((item) => (getCartLineKey(item) === lineKey ? { ...item, quantity } : item))
      .filter((item) => item.quantity > 0);

    updateCart(nextCart);
  };

  const onShippingAddressChange =
    (field: keyof CheckoutAddress) => (event: ChangeEvent<HTMLInputElement>) => {
      setShippingAddress((current) => ({
        ...current,
        [field]: event.target.value,
      }));
    };

  const onPaymentChange =
    (field: keyof MockPaymentInput) => (event: ChangeEvent<HTMLInputElement>) => {
      setPayment((current) => ({
        ...current,
        [field]: event.target.value,
      }));
    };

  const submitOrder = () => {
    if (!availableCart.length) {
      return;
    }

    if (overstockedItem) {
      setMessage(stockWarning);
      return;
    }

    if (!isSignedIn) {
      router.push("/login?redirectTo=/cart");
      return;
    }

    setMessage(null);
    startTransition(async () => {
      const result = await createPaidOrderFromCheckout({
        cart: availableCart,
        shippingAddress,
        deliveryOption,
        payment,
      });

      if (result.ok) {
        updateCart([]);
        setPayment({ ...EMPTY_MOCK_PAYMENT });
        router.push(`/account/orders?created=${result.orderId}`);
        return;
      }

      if (result.reason === "auth") {
        router.push("/login?redirectTo=/cart");
        return;
      }

      setMessage(result.error);
    });
  };

  return (
    <section className="mx-auto grid max-w-7xl gap-8 px-5 py-10 sm:px-8 lg:grid-cols-[minmax(0,1fr)_420px] lg:py-14 xl:grid-cols-[minmax(0,1fr)_460px]">
      <div className="min-w-0">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-orange-300">
              Cart
            </p>
            <h1 className="mt-2 text-3xl font-black text-white">Your running shoes</h1>
          </div>
          <Link
            href="/#catalog"
            className="inline-flex w-fit rounded-md border border-white/15 px-4 py-3 text-sm font-bold text-neutral-100 transition hover:border-orange-300 hover:text-orange-200"
          >
            Continue shopping
          </Link>
        </div>

        {availableCart.length === 0 ? (
          <div className="rounded-lg border border-white/10 bg-neutral-900 p-6">
            <p className="text-neutral-300">Your cart is empty.</p>
            <Link
              href="/#catalog"
              className="mt-5 inline-flex rounded-md bg-orange-500 px-5 py-3 font-black text-neutral-950 transition hover:bg-orange-400"
            >
              Shop running shoes
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {availableCart.map((item) => {
              const lineKey = getCartLineKey(item);
              const productQuantity = quantitiesByProduct.get(item.id) ?? item.quantity;
              const canIncrease = productQuantity < item.inventory;

              return (
              <article
                key={lineKey}
                className="grid gap-4 rounded-lg border border-white/10 bg-neutral-900 p-4 sm:grid-cols-[96px_minmax(0,1fr)_auto]"
              >
                <Image
                  src={item.imageUrl}
                  alt={item.name}
                  width={96}
                  height={96}
                  sizes="96px"
                  className="h-24 w-24 rounded-md object-cover"
                />
                <div className="min-w-0">
                  <h2 className="text-xl font-black text-white">{item.name}</h2>
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-neutral-300">
                    {item.description}
                  </p>
                  <p className="mt-3 font-bold text-orange-300">{formatPrice(item.price)}</p>
                  <p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-neutral-400">
                    <span>Size {item.selectedSize}</span>
                    <span aria-hidden="true">/</span>
                    <span className="inline-flex min-w-0 items-center gap-2">
                      <span
                        aria-hidden="true"
                        className="h-4 w-4 shrink-0 rounded-full border border-white/30"
                        style={{ backgroundColor: item.selectedColor.hex }}
                      />
                      {item.selectedColor.name}
                    </span>
                  </p>
                </div>
                <div className="flex items-center gap-3 sm:flex-col sm:items-end">
                  <div className="flex h-10 items-center overflow-hidden rounded-md border border-white/10">
                    <button
                      type="button"
                      onClick={() => updateQuantity(lineKey, item.quantity - 1)}
                      className="h-10 w-10 text-lg font-black text-neutral-200 hover:bg-white/5 hover:text-orange-200"
                      aria-label={`Decrease ${item.name} size ${item.selectedSize} ${item.selectedColor.name} quantity`}
                    >
                      -
                    </button>
                    <span className="w-10 text-center font-bold text-white">{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(lineKey, item.quantity + 1)}
                      disabled={!canIncrease}
                      className="h-10 w-10 text-lg font-black text-neutral-200 hover:bg-white/5 hover:text-orange-200 disabled:cursor-not-allowed disabled:text-neutral-600"
                      aria-label={`Increase ${item.name} size ${item.selectedSize} ${item.selectedColor.name} quantity`}
                    >
                      +
                    </button>
                  </div>
                  <p className="font-black text-white">{formatPrice(item.price * item.quantity)}</p>
                </div>
              </article>
              );
            })}
          </div>
        )}
      </div>

      <aside className="min-w-0 h-fit rounded-lg border border-white/10 bg-neutral-900 p-5 shadow-lg shadow-black/25 lg:sticky lg:top-6">
        <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-4">
          <h2 className="text-2xl font-black tracking-normal text-white">Checkout</h2>
          <span className="rounded-full bg-orange-500 px-3 py-1 text-sm font-bold text-neutral-950">
            {cartCount}
          </span>
        </div>

        {availableCart.length === 0 ? (
          <p className="py-8 text-sm leading-6 text-neutral-400">
            Add shoes from the catalog to start checkout.
          </p>
        ) : (
          <div className="mt-5">
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between gap-3 text-neutral-300">
                <span>Subtotal</span>
                <span className="font-bold text-white">{formatPrice(totals.subtotal)}</span>
              </div>
              <div className="flex items-center justify-between gap-3 text-neutral-300">
                <span>Shipping</span>
                <span className="font-bold text-white">{formatPrice(totals.shippingTotal)}</span>
              </div>
              <div className="flex items-center justify-between gap-3 text-neutral-300">
                <span>Tax</span>
                <span className="font-bold text-white">{formatPrice(totals.taxTotal)}</span>
              </div>
              <div className="flex items-center justify-between gap-3 border-t border-white/10 pt-3 text-lg">
                <span className="font-semibold text-neutral-200">Total</span>
                <span className="text-2xl font-black text-orange-300">
                  {formatPrice(totals.total)}
                </span>
              </div>
            </div>

            <div className="mt-6 grid gap-4 border-t border-white/10 pt-5">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-[0.14em] text-orange-300">
                  Shipping address
                </h3>
                <div className="mt-3 grid gap-3">
                  <label className="grid min-w-0 gap-1 text-sm text-neutral-300">
                    Name
                    <input
                      value={shippingAddress.name}
                      onChange={onShippingAddressChange("name")}
                      className="min-w-0 w-full rounded-md border border-white/10 bg-neutral-950 px-3 py-2 text-white outline-none focus:border-orange-300"
                    />
                  </label>
                  <label className="grid min-w-0 gap-1 text-sm text-neutral-300">
                    Address
                    <input
                      value={shippingAddress.line1}
                      onChange={onShippingAddressChange("line1")}
                      className="min-w-0 w-full rounded-md border border-white/10 bg-neutral-950 px-3 py-2 text-white outline-none focus:border-orange-300"
                    />
                  </label>
                  <label className="grid min-w-0 gap-1 text-sm text-neutral-300">
                    Apartment, suite, etc.
                    <input
                      value={shippingAddress.line2}
                      onChange={onShippingAddressChange("line2")}
                      className="min-w-0 w-full rounded-md border border-white/10 bg-neutral-950 px-3 py-2 text-white outline-none focus:border-orange-300"
                    />
                  </label>
                  <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_72px_104px]">
                    <label className="grid min-w-0 gap-1 text-sm text-neutral-300">
                      City
                      <input
                        value={shippingAddress.city}
                        onChange={onShippingAddressChange("city")}
                        className="min-w-0 w-full rounded-md border border-white/10 bg-neutral-950 px-3 py-2 text-white outline-none focus:border-orange-300"
                      />
                    </label>
                    <label className="grid min-w-0 gap-1 text-sm text-neutral-300">
                      State
                      <input
                        value={shippingAddress.state}
                        onChange={onShippingAddressChange("state")}
                        maxLength={2}
                        className="min-w-0 w-full rounded-md border border-white/10 bg-neutral-950 px-3 py-2 uppercase text-white outline-none focus:border-orange-300"
                      />
                    </label>
                    <label className="grid min-w-0 gap-1 text-sm text-neutral-300">
                      ZIP
                      <input
                        value={shippingAddress.postalCode}
                        onChange={onShippingAddressChange("postalCode")}
                        inputMode="numeric"
                        className="min-w-0 w-full rounded-md border border-white/10 bg-neutral-950 px-3 py-2 text-white outline-none focus:border-orange-300"
                      />
                    </label>
                  </div>
                  <label className="grid min-w-0 gap-1 text-sm text-neutral-300">
                    Phone
                    <input
                      value={shippingAddress.phone}
                      onChange={onShippingAddressChange("phone")}
                      className="min-w-0 w-full rounded-md border border-white/10 bg-neutral-950 px-3 py-2 text-white outline-none focus:border-orange-300"
                    />
                  </label>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold uppercase tracking-[0.14em] text-orange-300">
                  Delivery
                </h3>
                <div className="mt-3 grid gap-2">
                  {DELIVERY_OPTIONS.map((option) => {
                    const isStandardFree =
                      option.id === "standard" &&
                      totals.subtotal >= FREE_STANDARD_SHIPPING_THRESHOLD;
                    const optionPrice = isStandardFree ? 0 : option.price;

                    return (
                      <label
                        key={option.id}
                        className="grid cursor-pointer grid-cols-[auto_1fr_auto] items-center gap-3 rounded-md border border-white/10 bg-neutral-950 px-3 py-3 text-sm text-neutral-200 has-[:checked]:border-orange-300 has-[:checked]:bg-orange-500/10"
                      >
                        <input
                          type="radio"
                          name="deliveryOption"
                          value={option.id}
                          checked={deliveryOption === option.id}
                          onChange={() => setDeliveryOption(option.id)}
                          className="h-4 w-4 accent-orange-500"
                        />
                        <span>
                          <span className="block font-bold text-white">{option.name}</span>
                          <span className="block text-neutral-400">{option.eta}</span>
                        </span>
                        <span className="font-black text-orange-300">
                          {optionPrice === 0 ? "Free" : formatPrice(optionPrice)}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold uppercase tracking-[0.14em] text-orange-300">
                  Payment
                </h3>
                <div className="mt-3 grid gap-3">
                  <label className="grid min-w-0 gap-1 text-sm text-neutral-300">
                    Cardholder
                    <input
                      value={payment.cardholderName}
                      onChange={onPaymentChange("cardholderName")}
                      className="min-w-0 w-full rounded-md border border-white/10 bg-neutral-950 px-3 py-2 text-white outline-none focus:border-orange-300"
                    />
                  </label>
                  <label className="grid min-w-0 gap-1 text-sm text-neutral-300">
                    Card number
                    <input
                      value={payment.cardNumber}
                      onChange={onPaymentChange("cardNumber")}
                      inputMode="numeric"
                      placeholder="4242 4242 4242 4242"
                      className="min-w-0 w-full rounded-md border border-white/10 bg-neutral-950 px-3 py-2 text-white outline-none focus:border-orange-300"
                    />
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="grid min-w-0 gap-1 text-sm text-neutral-300">
                      Expires
                      <input
                        value={payment.expiration}
                        onChange={onPaymentChange("expiration")}
                        placeholder="12/34"
                        className="min-w-0 w-full rounded-md border border-white/10 bg-neutral-950 px-3 py-2 text-white outline-none focus:border-orange-300"
                      />
                    </label>
                    <label className="grid min-w-0 gap-1 text-sm text-neutral-300">
                      CVC
                      <input
                        value={payment.cvc}
                        onChange={onPaymentChange("cvc")}
                        inputMode="numeric"
                        maxLength={3}
                        className="min-w-0 w-full rounded-md border border-white/10 bg-neutral-950 px-3 py-2 text-white outline-none focus:border-orange-300"
                      />
                    </label>
                  </div>
                  <p className="text-xs leading-5 text-neutral-400">
                    Test success: 4242 4242 4242 4242. Test decline: 4000 0000
                    0000 9995.
                  </p>
                </div>
              </div>
            </div>

            {message || stockWarning ? (
              <p className="mt-4 rounded-md border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-100">
                {message ?? stockWarning}
              </p>
            ) : null}
            <button
              type="button"
              onClick={submitOrder}
              disabled={!availableCart.length || Boolean(overstockedItem) || isPending}
              className="mt-5 w-full rounded-md bg-orange-500 px-5 py-3 font-black text-neutral-950 transition hover:bg-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-300 disabled:cursor-not-allowed disabled:bg-neutral-700 disabled:text-neutral-400"
            >
              {isPending
                ? "Processing..."
                : isSignedIn
                  ? "Pay and place order"
                  : "Log in to buy"}
            </button>
          </div>
        )}
      </aside>
    </section>
  );
}
