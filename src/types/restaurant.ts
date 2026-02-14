export interface Product {
	id: string;
	name: string;
	quantity: number;
	unit: string;
	minStock: number;
	buyPrice?: number;
}

export interface Client {
	id: string;
	name: string;
	phone: string;
	email: string;
	description?: string;
}

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

export interface OrderItem {
	dishId: string;
	quantity: number;
	size: "small" | "medium" | "large";
}

export interface Order {
	id: string;
	orderNumber: number;
	items: OrderItem[];
	clientId?: string;
	description?: string;
	createdAt: string;
	status: "pending" | "confirmed" | "completed";
}
