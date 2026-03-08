/**
 * Backend API types matching the OpenAPI specification
 */

// Unit types supported by the API
export type UnitType = "grams" | "unit" | "ml" | "liters" | "kg";

// === Pagination Types ===
export interface PaginationParams {
  page?: number; // 1-based page number (default: 1)
  limit?: number; // Items per page (default: 20, max: 100)
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number; // Total count of items
  page: number; // Current page (1-based)
  limit: number; // Items per page
  totalPages: number; // Total number of pages
}

// Items (basic ingredients/materials)
export interface BackendItem {
	id: string; // UUID
	name: string;
	description?: string | null;
	unit_type: UnitType;
}

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

// Customers
export interface BackendCustomer {
	id: string; // UUID
	name: string;
	phone?: string | null;
	email?: string | null;
	address?: string | null;
	created_at: string; // ISO date string
	updated_at: string; // ISO date string
	orders?: any[]; // Array of order objects
	order_count?: number;
	order_in_progress_count?: number;
	order_finish_count?: number;
}

export interface CreateCustomerDto {
	name: string;
	phone?: string | null;
	email?: string | null;
	address?: string | null;
}

export interface UpdateCustomerDto {
	name?: string;
	phone?: string | null;
	email?: string | null;
	address?: string | null;
}

// Stock
export interface BackendStock {
	id: string;
	item_id: string;
	quantity: number;
	reserved_quantity: number;
	alert_quantity?: number | null;
	unitType: UnitType;
}

export interface CreateStockDto {
	itemId: string;
	quantity: number;
	purchase_price: number; // Purchase/cost value for the stock being added
	alert_quantity?: number | null;
}

export interface UpdateStockDto {
	operation: "add" | "remove";
	quantity: number;
	purchase_price?: number; // Purchase/cost value (when adding stock)
	alert_quantity?: number | null;
}

export interface StockHistoryEntry {
	id: string;
	stock_id: string;
	quantity: number;
	operation: "add" | "remove";
	item_name: string;
	purchase_price?: number;
	created_at: string;
}

// Products (composed of items)
export interface ProductItemDto {
	itemId: string;
	quantity: number; // quantity in item's unit type (grams, units, ml, liters, kg)
}

export interface BackendProduct {
	id: string; // UUID
	name: string;
	description?: string | null;
	price?: number | null; // selling price (informational)
	buyPrice?: number | null; // cost price (informational)
	is_additional?: boolean; // Whether this product is an additional (e.g. extra)
	items: ProductItemDto[];
}

export interface CreateProductDto {
	name: string;
	description?: string | null;
	price?: number | null;
	buyPrice?: number | null;
	is_additional?: boolean; // Whether this product is an additional (e.g. extra)
	items: ProductItemDto[];
}

export interface UpdateProductDto {
	name?: string;
	description?: string | null;
	price?: number | null;
	buyPrice?: number | null;
	is_additional?: boolean; // Whether this product is an additional (e.g. extra)
	items?: ProductItemDto[];
}

// Orders
export type OrderStatus = "request" | "in_progress" | "refuse" | "canceled" | "finish";

export interface BackendOrderProduct {
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

export interface BackendOrder {
	id: string;
	customer_id?: string | null; // UUID reference to customer
	customerId?: string | null; // @deprecated - use customer_id
	notes?: string | null;
	products: BackendOrderProduct[]; // array of embedded product objects
	status: OrderStatus;
	created_at: string;
	updated_at?: string;
	total?: string;
	customer?: BackendCustomer | null; // Embedded customer object (when expanded)
	order_items?: Array<{
		item_id: string;
		quantity: number;
		item?: BackendItem;
	}>;
}

export interface CreateOrderDto {
	customerId?: string | null; // UUID reference to customer
	forced_total?: number; // If provided, this value is used as the order total instead of calculating from product prices
	notes?: string | null;
	products: string[]; // array of product UUIDs
}

export interface UpdateOrderStatusDto {
	status: "in_progress" | "refuse" | "canceled" | "finish";
}
