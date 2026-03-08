// Re-export API types for backward compatibility
export type {
	Item,
	CreateItemDto,
	UpdateItemDto,
	UnitType,
	Product,
	CreateProductDto,
	UpdateProductDto,
	ProductItemDto,
	ProductItem,
	Stock,
	CreateStockDto,
	UpdateStockDto,
	Order,
	CreateOrderDto,
	UpdateOrderDto,
	UpdateOrderStatusDto,
	OrderItem,
	OrderProduct,
	OrderStatus,
	ApiError,
	PaginationParams,
	PaginatedResponse,
} from './api';

// Legacy types for UI components (if still needed)
export interface Client {
	id: string;
	name: string;
	phone: string;
	email: string;
	description?: string;
}

// Dish types for menu management (if needed beyond products)
export interface DishIngredient {
	productId: string;
	quantitySmall: number;
	quantityMedium: number;
	quantityLarge: number;
}

export interface Dish {
	id: string;
	name: string;
	priceSmall: number;
	priceMedium: number;
	priceLarge: number;
	ingredients: DishIngredient[];
}

// UI-specific types
export interface LowStockItem {
	item: Item;
	stock: Stock;
	threshold: number;
}

export interface StockWithItem extends Stock {
	item?: Item;
}

export interface ProductWithItems extends Product {
	product_items?: ProductItem[];
}

export interface OrderWithItems extends Order {
	order_items?: OrderItem[];
}
