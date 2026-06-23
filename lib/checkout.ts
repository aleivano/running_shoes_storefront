import type { CartItem, DeliveryOptionId } from "@/lib/types";

export type { DeliveryOptionId } from "@/lib/types";

export type CheckoutAddress = {
  name: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  postalCode: string;
  country: "US";
  phone: string;
};

export type MockPaymentInput = {
  cardholderName: string;
  cardNumber: string;
  expiration: string;
  cvc: string;
};

export type CheckoutTotals = {
  subtotal: number;
  shippingTotal: number;
  taxTotal: number;
  total: number;
};

export type DeliveryOption = {
  id: DeliveryOptionId;
  name: string;
  eta: string;
  price: number;
};

export type PaymentMethodSummary = {
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
};

export type CheckoutAddressValidationResult =
  | { ok: true; address: CheckoutAddress }
  | { ok: false; error: string };

export type MockPaymentResult =
  | { ok: true; reference: string; paymentMethod: PaymentMethodSummary }
  | { ok: false; error: string; code: "declined" | "invalid" };

export const DELIVERY_OPTIONS: DeliveryOption[] = [
  {
    id: "standard",
    name: "Standard",
    eta: "3-5 business days",
    price: 8,
  },
  {
    id: "express",
    name: "Express",
    eta: "1-2 business days",
    price: 18,
  },
];

export const FREE_STANDARD_SHIPPING_THRESHOLD = 150;
export const TAX_RATE = 0.0825;

export const EMPTY_CHECKOUT_ADDRESS: CheckoutAddress = {
  name: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "US",
  phone: "",
};

export const EMPTY_MOCK_PAYMENT: MockPaymentInput = {
  cardholderName: "",
  cardNumber: "",
  expiration: "",
  cvc: "",
};

export const isDeliveryOptionId = (value: string): value is DeliveryOptionId =>
  DELIVERY_OPTIONS.some((option) => option.id === value);

export const getDeliveryOption = (id: DeliveryOptionId) =>
  DELIVERY_OPTIONS.find((option) => option.id === id) ?? DELIVERY_OPTIONS[0];

export const calculateCartSubtotal = (cart: CartItem[]) =>
  cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

export const calculateCheckoutTotals = (
  subtotal: number,
  deliveryOption: DeliveryOptionId,
): CheckoutTotals => {
  const normalizedSubtotal = Math.max(0, Math.round(subtotal));
  const shippingTotal =
    normalizedSubtotal === 0
      ? 0
      : deliveryOption === "standard" && normalizedSubtotal >= FREE_STANDARD_SHIPPING_THRESHOLD
        ? 0
        : getDeliveryOption(deliveryOption).price;
  const taxTotal = Math.round((normalizedSubtotal + shippingTotal) * TAX_RATE);

  return {
    subtotal: normalizedSubtotal,
    shippingTotal,
    taxTotal,
    total: normalizedSubtotal + shippingTotal + taxTotal,
  };
};

export const validateCheckoutAddress = (
  address: CheckoutAddress,
): CheckoutAddressValidationResult => {
  const normalized: CheckoutAddress = {
    name: address.name.trim(),
    line1: address.line1.trim(),
    line2: address.line2.trim(),
    city: address.city.trim(),
    state: address.state.trim().toUpperCase(),
    postalCode: address.postalCode.trim(),
    country: "US",
    phone: address.phone.trim(),
  };

  if (!normalized.name) {
    return { ok: false, error: "Enter the recipient name." };
  }

  if (!normalized.line1) {
    return { ok: false, error: "Enter a street address." };
  }

  if (!normalized.city) {
    return { ok: false, error: "Enter a city." };
  }

  if (!/^[A-Z]{2}$/.test(normalized.state)) {
    return { ok: false, error: "Enter a valid two-letter US state." };
  }

  if (!/^\d{5}(-\d{4})?$/.test(normalized.postalCode)) {
    return { ok: false, error: "Enter a valid US ZIP code." };
  }

  return { ok: true, address: normalized };
};

export const processMockPayment = (payment: MockPaymentInput): MockPaymentResult => {
  const cardholderName = payment.cardholderName.trim();
  const cardNumber = payment.cardNumber.replace(/\D/g, "");
  const cvc = payment.cvc.trim();
  const expiration = payment.expiration.trim();

  if (!cardholderName) {
    return { ok: false, code: "invalid", error: "Enter the cardholder name." };
  }

  if (!/^\d{3}$/.test(cvc)) {
    return { ok: false, code: "invalid", error: "Enter a valid three-digit CVC." };
  }

  const expirationMatch = expiration.match(/^(\d{1,2})\s*\/\s*(\d{2}|\d{4})$/);

  if (!expirationMatch) {
    return { ok: false, code: "invalid", error: "Enter the expiration as MM/YY." };
  }

  const expMonth = Number(expirationMatch[1]);
  const expYearRaw = Number(expirationMatch[2]);
  const expYear = expYearRaw < 100 ? 2000 + expYearRaw : expYearRaw;
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  if (
    expMonth < 1 ||
    expMonth > 12 ||
    expYear < currentYear ||
    (expYear === currentYear && expMonth < currentMonth)
  ) {
    return { ok: false, code: "invalid", error: "Enter a valid future expiration date." };
  }

  if (cardNumber === "4000000000009995") {
    return {
      ok: false,
      code: "declined",
      error: "The test card was declined. Use 4242 4242 4242 4242 for a successful payment.",
    };
  }

  if (cardNumber !== "4242424242424242") {
    return {
      ok: false,
      code: "invalid",
      error: "Use the test card 4242 4242 4242 4242 to complete checkout.",
    };
  }

  return {
    ok: true,
    reference: `mock_${crypto.randomUUID()}`,
    paymentMethod: {
      brand: "Visa",
      last4: cardNumber.slice(-4),
      expMonth,
      expYear,
    },
  };
};
