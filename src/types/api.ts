// API DTOs based on OpenAPI specification

// === Items ===
export type UnitType = 'grams' | 'unit' | 'ml' | 'liters' | 'kg';

export interface CreateItemDto {
  name: string;
  description?: string | null;
  unit_type: UnitType;
}

export interface UpdateItemDto {
  name?: string;
  description?: string | null;
  unit_type?: UnitType;
}

export interface Item {
  id: string;
  name: string;
  description?: string | null;
  unit_type: UnitType;
  created_at?: string;
  updated_at?: string;
}

// === Products ===
export interface ProductItemDto {
  itemId: string;
  quantity: number; // Quantity in the item's unit (grams or units)
}

export interface CreateProductDto {
  name: string;
  description?: string | null;
  price?: number; // Selling price
  buyPrice?: number; // Purchase/cost price
  is_additional?: boolean; // Whether this product is an additional (e.g. extra)
  items: ProductItemDto[];
}

export interface UpdateProductDto {
  name?: string;
  description?: string | null;
  price?: number;
  buyPrice?: number;
  is_additional?: boolean; // Whether this product is an additional (e.g. extra)
  items?: ProductItemDto[];
}

export interface ProductItem {
  id: string;
  product_id: string;
  item_id: string;
  quantity: number;
  item?: Item;
}

export interface Product {
  id: string;
  name: string;
  description?: string | null;
  price?: number;
  buyPrice?: number;
  is_additional?: boolean; // Whether this product is an additional (e.g. extra)
  created_at?: string;
  updated_at?: string;
  product_items?: ProductItem[];
}

// === Stock ===
export interface CreateStockDto {
  itemId: string;
  quantity: number;
  purchase_price: number; // Purchase/cost value for the stock being added
  alert_quantity?: number | null;
}

export interface UpdateStockDto {
  operation: "add" | "remove"; // Operation type
  quantity: number; // Amount to add or remove (always positive)
  purchase_price?: number; // Purchase/cost value (when adding stock)
  alert_quantity?: number | null; // Optional: update alert threshold
}

export interface Stock {
  id: string;
  item_id: string;
  quantity: number;
  reserved_quantity: number;
  alert_quantity?: number | null;
  unitType: UnitType;
  created_at?: string;
  updated_at?: string;
  item?: Item;
}

// === Orders ===
export type OrderStatus = 'request' | 'in_progress' | 'refuse' | 'canceled' | 'finish';

export interface CreateOrderDto {
  customerId?: string | null; // UUID reference to customer
  forced_total?: number; // If provided, this value is used as the order total instead of calculating from product prices
  notes?: string | null;
  products: string[]; // Array of product IDs
}

export interface UpdateOrderStatusDto {
  status: 'in_progress' | 'refuse' | 'canceled' | 'finish';
}

export interface OrderItem {
  id: string;
  order_id: string;
  item_id: string;
  quantity: number;
  reserved_quantity: number;
  item?: Item;
}

export interface OrderProduct {
  id: string;
  name: string;
  description?: string | null;
  price: string;
  buy_price: string;
  quantity: string;
  total: string;
  created_at: string;
  updated_at: string;
  items?: Array<{
    id: string;
    name: string;
    description?: string | null;
    unit_type: UnitType;
    quantity: string;
    created_at: string;
    updated_at: string;
  }>;
}

export interface Order {
  id: string;
  customerId?: string | null; // UUID reference to customer
  notes?: string | null;
  products?: OrderProduct[]; // Array of embedded product objects
  status: OrderStatus;
  created_at: string;
  updated_at?: string;
  order_items?: OrderItem[];
}

// === User / Profile ===
export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  address?: string | null;
  role?: string;
  tenantId?: string;
  status?: string; // 'active' | 'inactive'
}

export interface UpdateUserDto {
  name: string;
  email: string;
  phone: string;
  address: string;
  password?: string;
  tenantId?: string; // admin: persiste no usuário para o próximo login
  role?: string;
  status?: string; // 'active' | 'inactive'
}

/** Create user (admin): POST /auth/register */
export interface RegisterDto {
  tenantId: string;
  role: string;
  name: string;
  email: string;
  phone?: string | null;
  address?: string | null;
  password: string;
}

// === Auth (from JWT payload) ===
export interface UserAuth {
  userId: string;
  role?: string;
  tenantId?: string;
  [key: string]: unknown;
}

// === Tenants ===
export interface Tenant {
  id: string;
  name: string;
  type?: 'kds' | string;
  created_at?: string;
  updated_at?: string;
  /** Included when GET /tenants returns embedded users */
  users?: User[];
}

/** Create tenant: POST /tenants */
export interface CreateTenantDto {
  name: string;
  type?: 'kds';
}

// === API Response Types ===
export interface ApiError {
  statusCode: number;
  message: string | string[];
  error?: string;
}
