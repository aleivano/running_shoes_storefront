import Image from "next/image";
import { cancelOrderFromForm } from "@/app/actions/orders";
import { DELIVERY_OPTIONS } from "@/lib/checkout";
import { formatDate, formatPrice } from "@/lib/format";
import { getOrders } from "@/lib/data";
import type { DeliveryOptionId, OrderStatus } from "@/lib/types";

type OrdersPageProps = {
  searchParams: Promise<{
    created?: string;
  }>;
};

const canCancel = (status: OrderStatus) => status === "pending" || status === "processing";

const getString = (value: unknown) => (typeof value === "string" ? value : "");

const getDeliveryLabel = (deliveryOption: DeliveryOptionId) =>
  DELIVERY_OPTIONS.find((option) => option.id === deliveryOption)?.name ?? "Standard";

export default async function OrdersPage({ searchParams }: OrdersPageProps) {
  const [{ created }, orders] = await Promise.all([searchParams, getOrders()]);

  return (
    <section className="grid gap-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-orange-300">
          Orders
        </p>
        <h1 className="mt-2 text-3xl font-black text-white">Current and past orders</h1>
      </div>

      {created ? (
        <p className="rounded-md border border-orange-400/30 bg-orange-500/10 p-4 text-sm text-orange-100">
          Order placed. Payment is complete and your shoes are moving into processing.
        </p>
      ) : null}

      {!orders.length ? (
        <div className="rounded-lg border border-white/10 bg-neutral-900 p-6">
          <p className="text-neutral-300">No orders yet.</p>
        </div>
      ) : (
        <div className="grid gap-5">
          {orders.map((order) => {
            const city = getString(order.shippingAddress.city);
            const state = getString(order.shippingAddress.state);
            const postalCode = getString(order.shippingAddress.postalCode);
            const paymentBrand = getString(order.paymentMethod.brand);
            const paymentLast4 = getString(order.paymentMethod.last4);
            const destination = [city, state, postalCode].filter(Boolean).join(", ");

            return (
              <article key={order.id} className="rounded-lg border border-white/10 bg-neutral-900 p-5">
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/10 pb-4">
                  <div>
                    <p className="text-sm text-neutral-400">Order {order.id.slice(0, 8)}</p>
                    <h2 className="mt-1 text-xl font-black text-white">
                      {formatPrice(order.total)} / {formatDate(order.createdAt)}
                    </h2>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="rounded-full bg-orange-500/15 px-3 py-1 text-sm font-bold capitalize text-orange-200">
                      {order.status}
                    </span>
                    <span className="rounded-full bg-white/10 px-3 py-1 text-sm font-bold capitalize text-neutral-200">
                      {order.paymentStatus}
                    </span>
                    {canCancel(order.status) ? (
                      <form action={cancelOrderFromForm}>
                        <input type="hidden" name="orderId" value={order.id} />
                        <button
                          type="submit"
                          className="rounded-md border border-red-300/40 px-3 py-2 text-sm font-bold text-red-100 hover:bg-red-500/10"
                        >
                          Cancel
                        </button>
                      </form>
                    ) : null}
                  </div>
                </div>

                <ul className="divide-y divide-white/10">
                  {order.items?.map((item) => (
                    <li key={item.id} className="flex gap-4 py-4">
                      <Image
                        src={item.productImageUrl}
                        alt={item.productName}
                        width={64}
                        height={64}
                        sizes="64px"
                        className="h-16 w-16 rounded-md object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-white">{item.productName}</p>
                        <p className="mt-1 text-sm text-neutral-400">
                          {item.quantity} x {formatPrice(item.unitPrice)}
                        </p>
                        {item.selectedSize || item.selectedColorName ? (
                          <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-neutral-400">
                            {item.selectedSize ? <span>Size {item.selectedSize}</span> : null}
                            {item.selectedSize && item.selectedColorName ? (
                              <span aria-hidden="true">/</span>
                            ) : null}
                            {item.selectedColorName ? (
                              <span className="inline-flex items-center gap-2">
                                {item.selectedColorHex ? (
                                  <span
                                    aria-hidden="true"
                                    className="h-4 w-4 rounded-full border border-white/30"
                                    style={{ backgroundColor: item.selectedColorHex }}
                                  />
                                ) : null}
                                {item.selectedColorName}
                              </span>
                            ) : null}
                          </p>
                        ) : null}
                      </div>
                      <p className="font-bold text-orange-300">{formatPrice(item.lineTotal)}</p>
                    </li>
                  ))}
                </ul>

                <div className="grid gap-4 border-t border-white/10 pt-4 text-sm md:grid-cols-2">
                  <div className="grid gap-2">
                    <div className="flex items-center justify-between gap-3 text-neutral-300">
                      <span>Subtotal</span>
                      <span className="font-bold text-white">{formatPrice(order.subtotal)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3 text-neutral-300">
                      <span>Shipping</span>
                      <span className="font-bold text-white">
                        {formatPrice(order.shippingTotal)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3 text-neutral-300">
                      <span>Tax</span>
                      <span className="font-bold text-white">{formatPrice(order.taxTotal)}</span>
                    </div>
                  </div>
                  <div className="grid gap-2 text-neutral-300">
                    <p>
                      <span className="font-semibold text-white">Delivery:</span>{" "}
                      {getDeliveryLabel(order.deliveryOption)}
                    </p>
                    <p>
                      <span className="font-semibold text-white">Ship to:</span>{" "}
                      {destination || "Address on file"}
                    </p>
                    <p>
                      <span className="font-semibold text-white">Payment:</span>{" "}
                      {paymentBrand && paymentLast4
                        ? `${paymentBrand} ending in ${paymentLast4}`
                        : order.paymentProvider}
                    </p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
