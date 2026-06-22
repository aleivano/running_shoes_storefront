export type ProductStatus = "active" | "archived";

export type OrderStatus =
  | "pending"
  | "processing"
  | "shipped"
  | "delivered"
  | "canceled";

export type PaymentStatus = "unpaid" | "pending" | "paid" | "failed" | "refunded";

export type Product = {
  id: number;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  inventory: number;
  status: ProductStatus;
};

export type CartItem = Product & {
  quantity: number;
};

export type Profile = {
  id: string;
  email: string;
  username: string;
  displayName: string | null;
  phone: string | null;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

export type OrderItem = {
  id: string;
  orderId: string;
  productId: number | null;
  productName: string;
  productImageUrl: string;
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
  createdAt: string;
  updatedAt: string;
  items?: OrderItem[];
};

export type Favorite = {
  userId: string;
  productId: number;
  createdAt: string;
};
