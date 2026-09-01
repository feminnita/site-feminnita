export type Address = {
  id: string;
  label: string | null;
  street: string;
  number: string;
  complement: string | null;
  neighborhood: string;
  city: string;
  state: string;
  cep: string;
  isDefault: boolean | null;
};

export type AddressInput = {
  label: string;
  cep: string;
  street: string;
  number: string;
  complement: string | null;
  neighborhood: string;
  city: string;
  state: string;
  isDefault: boolean;
};

export type AccountCustomer = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  cpf: string | null;
  birthDate: string | null;
};

export type CustomerUpdate = {
  name: string;
  phone: string | null;
  cpf: string | null;
  birthDate: string | null;
};

export type AccountOrderItem = {
  id: string;
  productName: string;
  size: string | null;
  quantity: number;
};

export type AccountOrder = {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  total: number;
  createdAt: string;
  items: AccountOrderItem[];
};

export type OrderDetailItem = {
  id: string;
  productId: string | null;
  productName: string;
  productImage: string | null;
  color: string | null;
  size: string | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
};

export type OrderShippingAddress = {
  cep?: string;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
};

export type AccountOrderDetail = {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string | null;
  installments: number | null;
  subtotal: number;
  shippingCost: number;
  discount: number;
  total: number;
  couponCode: string | null;
  shippingMethod: string | null;
  trackingCode: string | null;
  trackingUrl: string | null;
  shippingAddress: OrderShippingAddress | null;
  createdAt: string;
  shippedAt: string | null;
  items: OrderDetailItem[];
};

export type AccountTab = "pedidos" | "dados" | "enderecos";
