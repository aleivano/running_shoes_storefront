export type ProductStatus = "active" | "archived";

export type AppRole = "customer" | "catalog_editor" | "admin";

export type OrderStatus =
  | "pending"
  | "processing"
  | "shipped"
  | "delivered"
  | "canceled";

export type PaymentStatus = "unpaid" | "pending" | "paid" | "failed" | "refunded";

export type DeliveryOptionId = "standard" | "express";

export type ProductSpec = {
  label: string;
  value: string;
};

export type ProductColor = {
  name: string;
  hex: string;
  imageUrl?: string;
};

export type Product = {
  id: number;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  inventory: number;
  status: ProductStatus;
  sizingInfo: string;
  fitNotes: string;
  specs: ProductSpec[];
  availableSizes: string[];
  availableColors: ProductColor[];
};

export type CartItem = Product & {
  selectedSize: string;
  selectedColor: ProductColor;
  quantity: number;
};

export type Profile = {
  id: string;
  email: string;
  username: string;
  displayName: string | null;
  phone: string | null;
  avatarUrl: string | null;
  role: AppRole;
  createdAt: string;
  updatedAt: string;
};

export type OrderItem = {
  id: string;
  orderId: string;
  productId: number | null;
  productName: string;
  productImageUrl: string;
  selectedSize: string;
  selectedColorName: string;
  selectedColorHex: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
};

export type Order = {
  id: string;
  userId: string;
  status: OrderStatus;
  subtotal: number;
  shippingTotal: number;
  taxTotal: number;
  total: number;
  currency: string;
  paymentStatus: PaymentStatus;
  shippingAddress: Record<string, unknown>;
  deliveryOption: DeliveryOptionId;
  paymentProvider: string;
  paymentReference: string | null;
  paymentMethod: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  items?: OrderItem[];
};

export type Favorite = {
  userId: string;
  productId: number;
  createdAt: string;
};
