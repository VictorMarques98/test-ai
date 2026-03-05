import { create } from "zustand";
import { 
	Item, 
	Product, 
	Stock, 
	Order, 
	Client,
	CreateItemDto,
	UpdateItemDto,
	CreateProductDto,
	UpdateProductDto,
	CreateStockDto,
	UpdateStockDto,
	CreateOrderDto,
	UpdateOrderDto,
	UpdateOrderStatusDto,
	StockWithItem,
	ProductWithItems,
	OrderWithItems,
} from "@/types/restaurant";
import type { StockHistoryEntry } from "@/types/backend";
import itemsService from "@/services/itemsService";
import productsService from "@/services/productsService";
import stockService from "@/services/stockService";
import ordersService from "@/services/ordersService";

interface RestaurantStore {
	// State
	items: Item[];
	products: Product[];
	stock: Stock[];
	stockHistory: StockHistoryEntry[];
	orders: Order[];
	clients: Client[];
	isLoading: boolean;
	error: string | null;

	// Items actions
	fetchItems: () => Promise<void>;
	createItem: (data: CreateItemDto) => Promise<Item>;
	updateItem: (id: string, data: UpdateItemDto) => Promise<void>;
	deleteItem: (id: string) => Promise<void>;

	// Products actions
	fetchProducts: () => Promise<void>;
	createProduct: (data: CreateProductDto) => Promise<Product>;
	updateProduct: (id: string, data: UpdateProductDto) => Promise<void>;
	deleteProduct: (id: string) => Promise<void>;

	// Stock actions
	fetchStock: () => Promise<void>;
	fetchStockHistory: () => Promise<void>;
	createStock: (data: CreateStockDto) => Promise<Stock>;
	updateStock: (id: string, data: UpdateStockDto) => Promise<void>;
	getStockByItemId: (itemId: string) => Promise<Stock | null>;

	// Orders actions
	fetchOrders: () => Promise<void>;
	createOrder: (data: CreateOrderDto) => Promise<Order>;
	updateOrder: (id: string, data: UpdateOrderDto) => Promise<Order>;
	updateOrderStatus: (id: string, status: UpdateOrderStatusDto['status']) => Promise<void>;

	// Clients actions (still local until backend supports it)
	addClient: (c: Omit<Client, "id">) => string;
	updateClient: (id: string, c: Partial<Client>) => void;
	deleteClient: (id: string) => void;

	// Utility actions
	setError: (error: string | null) => void;
	clearError: () => void;

	// Computed getters
	getLowStockItems: (threshold?: number) => StockWithItem[];
}

const genId = () => Math.random().toString(36).slice(2, 10);

export const useRestaurantStore = create<RestaurantStore>((set, get) => ({
	// Initial state
	items: [],
	products: [],
	stock: [],
	stockHistory: [],
	orders: [],
	clients: [],
	isLoading: false,
	error: null,

	// === Items ===
	fetchItems: async () => {
		set({ isLoading: true, error: null });
		try {
			const items = await itemsService.getAll();
			set({ items, isLoading: false });
		} catch (error: any) {
			set({ error: error.message || 'Failed to fetch items', isLoading: false });
			throw error;
		}
	},

	createItem: async (data: CreateItemDto) => {
		set({ isLoading: true, error: null });
		try {
			const newItem = await itemsService.create(data);
			set((state) => ({ 
				items: [...state.items, newItem], 
				isLoading: false 
			}));
			return newItem;
		} catch (error: any) {
			set({ error: error.message || 'Failed to create item', isLoading: false });
			throw error;
		}
	},

	updateItem: async (id: string, data: UpdateItemDto) => {
		set({ isLoading: true, error: null });
		try {
			const updatedItem = await itemsService.update(id, data);
			set((state) => ({
				items: state.items.map((item) => item.id === id ? updatedItem : item),
				isLoading: false,
			}));
		} catch (error: any) {
			set({ error: error.message || 'Failed to update item', isLoading: false });
			throw error;
		}
	},

	deleteItem: async (id: string) => {
		set({ isLoading: true, error: null });
		try {
			await itemsService.delete(id);
			set((state) => ({
				items: state.items.filter((item) => item.id !== id),
				isLoading: false,
			}));
		} catch (error: any) {
			set({ error: error.message || 'Failed to delete item', isLoading: false });
			throw error;
		}
	},

	// === Products ===
	fetchProducts: async () => {
		set({ isLoading: true, error: null });
		try {
			const products = await productsService.getAll();
			set({ products, isLoading: false });
		} catch (error: any) {
			set({ error: error.message || 'Failed to fetch products', isLoading: false });
			throw error;
		}
	},

	createProduct: async (data: CreateProductDto) => {
		set({ isLoading: true, error: null });
		try {
			const newProduct = await productsService.create(data);
			set((state) => ({ 
				products: [...state.products, newProduct], 
				isLoading: false 
			}));
			return newProduct;
		} catch (error: any) {
			set({ error: error.message || 'Failed to create product', isLoading: false });
			throw error;
		}
	},

	updateProduct: async (id: string, data: UpdateProductDto) => {
		set({ isLoading: true, error: null });
		try {
			const updatedProduct = await productsService.update(id, data);
			set((state) => ({
				products: state.products.map((product) => product.id === id ? updatedProduct : product),
				isLoading: false,
			}));
		} catch (error: any) {
			set({ error: error.message || 'Failed to update product', isLoading: false });
			throw error;
		}
	},

	deleteProduct: async (id: string) => {
		set({ isLoading: true, error: null });
		try {
			await productsService.delete(id);
			set((state) => ({
				products: state.products.filter((product) => product.id !== id),
				isLoading: false,
			}));
		} catch (error: any) {
			set({ error: error.message || 'Failed to delete product', isLoading: false });
			throw error;
		}
	},

	// === Stock ===
	fetchStock: async () => {
		set({ isLoading: true, error: null });
		try {
			const stock = await stockService.getAll();
			set({ stock, isLoading: false });
		} catch (error: any) {
			set({ error: error.message || 'Failed to fetch stock', isLoading: false });
			throw error;
		}
	},

	createStock: async (data: CreateStockDto) => {
		set({ isLoading: true, error: null });
		try {
			const newStock = await stockService.create(data);
			set((state) => ({ 
				stock: [...state.stock, newStock], 
				isLoading: false 
			}));
			return newStock;
		} catch (error: any) {
			set({ error: error.message || 'Failed to create stock', isLoading: false });
			throw error;
		}
	},

	updateStock: async (id: string, data: UpdateStockDto) => {
		set({ isLoading: true, error: null });
		try {
			const updatedStock = await stockService.update(id, data);
			set((state) => ({
				stock: state.stock.map((s) => s.id === id ? updatedStock : s),
				isLoading: false,
			}));
			// Fetch updated history after stock update
			await get().fetchStockHistory();
		} catch (error: any) {
			set({ error: error.message || 'Failed to update stock', isLoading: false });
			throw error;
		}
	},

	fetchStockHistory: async () => {
		try {
			const history = await stockService.getHistory();
			set({ stockHistory: history });
		} catch (error: any) {
			console.error('Failed to fetch stock history:', error);
			// Don't throw error for history, just log it
		}
	},

	getStockByItemId: async (itemId: string) => {
		set({ isLoading: true, error: null });
		try {
			const stock = await stockService.getByItemId(itemId);
			set({ isLoading: false });
			return stock;
		} catch (error: any) {
			set({ error: error.message || 'Failed to get stock', isLoading: false });
			return null;
		}
	},

	// === Orders ===
	fetchOrders: async () => {
		set({ isLoading: true, error: null });
		try {
			const orders = await ordersService.getAll();
			set({ orders, isLoading: false });
		} catch (error: any) {
			set({ error: error.message || 'Failed to fetch orders', isLoading: false });
			throw error;
		}
	},

	createOrder: async (data: CreateOrderDto) => {
		set({ isLoading: true, error: null });
		try {
			const newOrder = await ordersService.create(data);
			set((state) => ({ 
				orders: [...state.orders, newOrder], 
				isLoading: false 
			}));
			return newOrder;
		} catch (error: any) {
			set({ error: error.message || 'Failed to create order', isLoading: false });
			throw error;
		}
	},

	updateOrderStatus: async (id: string, status: UpdateOrderStatusDto['status']) => {
		set({ isLoading: true, error: null });
		try {
			const updatedOrder = await ordersService.updateStatus(id, { status });
			set((state) => ({
				orders: state.orders.map((order) => order.id === id ? updatedOrder : order),
				isLoading: false,
			}));
		} catch (error: any) {
			set({ error: error.message || 'Failed to update order status', isLoading: false });
			throw error;
		}
	},

	updateOrder: async (id: string, data: UpdateOrderDto) => {
		set({ isLoading: true, error: null });
		try {
			const updatedOrder = await ordersService.update(id, data);
			set((state) => ({
				orders: state.orders.map((order) => order.id === id ? updatedOrder : order),
				isLoading: false,
			}));
			return updatedOrder;
		} catch (error: any) {
			set({ error: error.message || 'Failed to update order', isLoading: false });
			throw error;
		}
	},

	// === Clients (local for now) ===
	addClient: (c) => {
		const newId = genId();
		set((state) => ({ clients: [...state.clients, { ...c, id: newId }] }));
		return newId;
	},

	updateClient: (id, c) =>
		set((state) => ({ clients: state.clients.map((x) => (x.id === id ? { ...x, ...c } : x)) })),

	deleteClient: (id) => set((state) => ({ clients: state.clients.filter((x) => x.id !== id) })),

	// === Utility ===
	setError: (error) => set({ error }),
	clearError: () => set({ error: null }),

	// === Computed ===
	getLowStockItems: (threshold = 10) => {
		const state = get();
		return state.stock
			.filter((s) => s.quantity < threshold)
			.map((s) => ({
				...s,
				item: state.items.find((i) => i.id === s.item_id),
			}))
			.filter((s) => s.item !== undefined) as StockWithItem[];
	},
}));

export default useRestaurantStore;
