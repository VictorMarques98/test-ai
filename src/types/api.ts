// API DTOs based on OpenAPI specification

// === Items ===
export type UnitType = 'grams' | 'unit';

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
  items: ProductItemDto[];
}

export interface UpdateProductDto {
  name?: string;
  description?: string | null;
  price?: number;
  buyPrice?: number;
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
  created_at?: string;
  updated_at?: string;
  product_items?: ProductItem[];
}

// === Stock ===
export interface CreateStockDto {
  itemId: string;
  quantity: number;
  alert_quantity?: number | null;
}

export interface UpdateStockDto {
  quantity: number; // Replaces current stock quantity
  alert_quantity?: number | null;
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
  customer_name?: string | null;
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

export interface Order {
  id: string;
  customer_name?: string | null;
  notes?: string | null;
  status: OrderStatus;
  created_at: string;
  updated_at?: string;
  order_items?: OrderItem[];
}

// === API Response Types ===
export interface ApiError {
  statusCode: number;
  message: string | string[];
  error?: string;
}
