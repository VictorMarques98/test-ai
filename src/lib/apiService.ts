import { apiClient } from "@/lib/api";
import type {
	BackendItem,
	CreateItemDto,
	UpdateItemDto,
	BackendCustomer,
	CreateCustomerDto,
	UpdateCustomerDto,
	BackendStock,
	CreateStockDto,
	UpdateStockDto,
	StockHistoryEntry,
	BackendProduct,
	CreateProductDto,
	UpdateProductDto,
	BackendOrder,
	CreateOrderDto,
	UpdateOrderStatusDto,
	PaginationParams,
	PaginatedResponse,
} from "@/types/backend";

/**
 * API Service for Kitchen Display System Backend
 * Complete implementation of all endpoints from OpenAPI spec
 */

// ============ ITEMS ============
/**
 * Items represent basic ingredients/materials (e.g., tomatoes, cheese, flour)
 * Each item has a unit_type that defines how it's measured
 */
export const itemsAPI = {
	/**
	 * GET /items
	 * List all items in the system
	 */
	async getAll(): Promise<BackendItem[]> {
		const response = await apiClient.get<BackendItem[]>("/items");
		return response.data;
	},

	/**
	 * GET /items/{id}
	 * Get a specific item by its UUID
	 */
	async getById(id: string): Promise<BackendItem> {
		const response = await apiClient.get<BackendItem>(`/items/${id}`);
		return response.data;
	},

	/**
	 * POST /items
	 * Create a new item
	 */
	async create(data: CreateItemDto): Promise<BackendItem> {
		const response = await apiClient.post<BackendItem>("/items", data);
		return response.data;
	},

	/**
	 * PATCH /items/{id}
	 * Update an existing item
	 */
	async update(id: string, data: UpdateItemDto): Promise<BackendItem> {
		const response = await apiClient.patch<BackendItem>(`/items/${id}`, data);
		return response.data;
	},

	/**
	 * DELETE /items/{id}
	 * Remove an item from the system
	 */
	async delete(id: string): Promise<void> {
		await apiClient.delete(`/items/${id}`);
	},
};

// ============ CUSTOMERS ============
/**
 * Customers represent clients who place orders
 * Can be linked to orders via customerId
 */
export const customersAPI = {
	/**
	 * GET /customers
	 * List customers with pagination support
	 * @param params - Optional pagination parameters (page, limit)
	 * @returns Paginated response or array (for backward compatibility)
	 */
	async getAll(params?: PaginationParams): Promise<PaginatedResponse<BackendCustomer>> {
		const queryParams = new URLSearchParams();
		if (params?.page) queryParams.set('page', params.page.toString());
		if (params?.limit) queryParams.set('limit', params.limit.toString());
		const url = queryParams.toString() ? `/customers?${queryParams}` : '/customers';
		const response = await apiClient.get<PaginatedResponse<BackendCustomer>>(url);
		return response.data;
	},

	/**
	 * GET /customers/{id}
	 * Get a specific customer by UUID
	 */
	async getById(id: string): Promise<BackendCustomer> {
		const response = await apiClient.get<BackendCustomer>(`/customers/${id}`);
		return response.data;
	},

	/**
	 * POST /customers
	 * Create a new customer
	 */
	async create(data: CreateCustomerDto): Promise<BackendCustomer> {
		const response = await apiClient.post<BackendCustomer>("/customers", data);
		return response.data;
	},

	/**
	 * PATCH /customers/{id}
	 * Update an existing customer
	 */
	async update(id: string, data: UpdateCustomerDto): Promise<BackendCustomer> {
		const response = await apiClient.patch<BackendCustomer>(`/customers/${id}`, data);
		return response.data;
	},

	/**
	 * DELETE /customers/{id}
	 * Remove a customer
	 */
	async delete(id: string): Promise<void> {
		await apiClient.delete(`/customers/${id}`);
	},
};

// ============ STOCK ============
/**
 * Stock tracks inventory levels for each item
 * Includes quantity, reserved_quantity, and alert thresholds
 */
export const stockAPI = {
	/**
	 * GET /stock
	 * List all stock entries
	 * Returns: id, item_id, quantity, reserved_quantity, alert_quantity, unitType
	 */
	async getAll(): Promise<BackendStock[]> {
		const response = await apiClient.get<BackendStock[]>("/stock");
		return response.data;
	},

	/**
	 * GET /stock/{id}
	 * Get stock entry by stock ID
	 */
	async getById(id: string): Promise<BackendStock> {
		const response = await apiClient.get<BackendStock>(`/stock/${id}`);
		return response.data;
	},

	/**
	 * GET /stock/item/{itemId}
	 * Get stock for a specific item by item ID
	 */
	async getByItemId(itemId: string): Promise<BackendStock> {
		const response = await apiClient.get<BackendStock>(`/stock/item/${itemId}`);
		return response.data;
	},

	/**
	 * POST /stock
	 * Create stock entry for an item
	 * Note: Only one stock entry per item is allowed (409 if exists)
	 */
	async create(data: CreateStockDto): Promise<BackendStock> {
		const response = await apiClient.post<BackendStock>("/stock", data);
		return response.data;
	},

	/**
	 * PATCH /stock/{id}
	 * Add or remove quantity from stock
	 * Creates a history record automatically
	 * Operation: "add" (incoming) or "remove" (outgoing)
	 */
	async update(id: string, data: UpdateStockDto): Promise<BackendStock> {
		const response = await apiClient.patch<BackendStock>(`/stock/${id}`, data);
		return response.data;
	},

	/**
	 * GET /stock/history
	 * List stock history entries with pagination, newest first
	 * @param params - Optional pagination parameters (page, limit)
	 * @returns Paginated response of history entries
	 */
	async getHistory(params?: PaginationParams): Promise<PaginatedResponse<StockHistoryEntry>> {
		const queryParams = new URLSearchParams();
		if (params?.page) queryParams.set('page', params.page.toString());
		if (params?.limit) queryParams.set('limit', params.limit.toString());
		const url = queryParams.toString() ? `/stock/history?${queryParams}` : '/stock/history';
		const response = await apiClient.get<PaginatedResponse<StockHistoryEntry>>(url);
		return response.data;
	},
};

// ============ PRODUCTS ============
/**
 * Products are composed of items (e.g., a burger made of bun, patty, cheese)
 * Each product has a list of items with quantities
 */
export const productsAPI = {
	/**
	 * GET /products
	 * List all products with their item compositions
	 */
	async getAll(): Promise<BackendProduct[]> {
		const response = await apiClient.get<BackendProduct[]>("/products");
		return response.data;
	},

	/**
	 * GET /products/{id}
	 * Get a specific product by UUID
	 */
	async getById(id: string): Promise<BackendProduct> {
		const response = await apiClient.get<BackendProduct>(`/products/${id}`);
		return response.data;
	},

	/**
	 * POST /products
	 * Create a new product with its item composition
	 * Validates that all items exist and have compatible unit types
	 */
	async create(data: CreateProductDto): Promise<BackendProduct> {
		const response = await apiClient.post<BackendProduct>("/products", data);
		return response.data;
	},

	/**
	 * PATCH /products/{id}
	 * Update an existing product
	 */
	async update(id: string, data: UpdateProductDto): Promise<BackendProduct> {
		const response = await apiClient.patch<BackendProduct>(`/products/${id}`, data);
		return response.data;
	},

	/**
	 * DELETE /products/{id}
	 * Remove a product
	 */
	async delete(id: string): Promise<void> {
		await apiClient.delete(`/products/${id}`);
	},
};

// ============ ORDERS ============
/**
 * Orders represent customer requests for products
 * Products array can contain repeated UUIDs (each occurrence = 1 unit)
 * Items and quantities are derived from each product's composition
 */
export const ordersAPI = {
	/**
	 * GET /orders
	 * List orders with pagination support
	 * @param params - Optional pagination parameters (page, limit)
	 * @returns Paginated response or array (for backward compatibility)
	 */
	async getAll(params?: PaginationParams): Promise<PaginatedResponse<BackendOrder>> {
		const queryParams = new URLSearchParams();
		if (params?.page) queryParams.set('page', params.page.toString());
		if (params?.limit) queryParams.set('limit', params.limit.toString());
		const url = queryParams.toString() ? `/orders?${queryParams}` : '/orders';
		const response = await apiClient.get<PaginatedResponse<BackendOrder>>(url);
		return response.data;
	},

	/**
	 * GET /orders/{id}
	 * Get a specific order by UUID
	 */
	async getById(id: string): Promise<BackendOrder> {
		const response = await apiClient.get<BackendOrder>(`/orders/${id}`);
		return response.data;
	},

	/**
	 * POST /orders
	 * Create a new order
	 * Products: array of product UUIDs (repeating = multiple units)
	 * Automatically calculates required items from product compositions
	 * Validates stock availability before creating
	 */
	async create(data: CreateOrderDto): Promise<BackendOrder> {
		const response = await apiClient.post<BackendOrder>("/orders", data);
		return response.data;
	},

	/**
	 * PATCH /orders/{id}/status
	 * Update order status
	 * Valid transitions:
	 * - request → in_progress
	 * - request → refuse
	 * - in_progress → finish
	 * - in_progress → canceled
	 */
	async updateStatus(id: string, data: UpdateOrderStatusDto): Promise<void> {
		await apiClient.patch(`/orders/${id}/status`, data);
	},
};

// Export all APIs as a single object for convenience
export const api = {
	items: itemsAPI,
	customers: customersAPI,
	stock: stockAPI,
	products: productsAPI,
	orders: ordersAPI,
};

export default api;
