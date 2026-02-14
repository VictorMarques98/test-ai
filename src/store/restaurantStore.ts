import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Product, Dish, Order, Client } from '@/types/restaurant';

interface RestaurantStore {
  products: Product[];
  dishes: Dish[];
  orders: Order[];
  clients: Client[];
  addProduct: (p: Omit<Product, 'id'>) => void;
  updateProduct: (id: string, p: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  addDish: (d: Omit<Dish, 'id'>) => void;
  updateDish: (id: string, d: Partial<Dish>) => void;
  deleteDish: (id: string) => void;
  addOrder: (items: Order['items'], clientId?: string) => string;
  updateOrderStatus: (id: string, status: Order['status']) => void;
  confirmOrder: (id: string) => void;
  addClient: (c: Omit<Client, 'id'>) => void;
  updateClient: (id: string, c: Partial<Client>) => void;
  deleteClient: (id: string) => void;
}

const genId = () => Math.random().toString(36).slice(2, 10);

export const useRestaurantStore = create<RestaurantStore>()(
  persist(
    (set, get) => ({
      products: [],
      dishes: [],
      orders: [],
      clients: [],
      addProduct: (p) => set((s) => ({ products: [...s.products, { ...p, id: genId() }] })),
      updateProduct: (id, p) => set((s) => ({ products: s.products.map((x) => (x.id === id ? { ...x, ...p } : x)) })),
      deleteProduct: (id) => set((s) => ({ products: s.products.filter((x) => x.id !== id) })),
      addDish: (d) => set((s) => ({ dishes: [...s.dishes, { ...d, id: genId() }] })),
      updateDish: (id, d) => set((s) => ({ dishes: s.dishes.map((x) => (x.id === id ? { ...x, ...d } : x)) })),
      deleteDish: (id) => set((s) => ({ dishes: s.dishes.filter((x) => x.id !== id) })),
      addOrder: (items, clientId) => {
        const id = genId();
        set((s) => ({
          orders: [...s.orders, { id, items, clientId, createdAt: new Date().toISOString(), status: 'pending' }],
        }));
        return id;
      },
      updateOrderStatus: (id, status) =>
        set((s) => ({ orders: s.orders.map((o) => (o.id === id ? { ...o, status } : o)) })),
      confirmOrder: (id) => {
        const state = get();
        const order = state.orders.find((o) => o.id === id);
        if (!order) return;
        const updatedProducts = [...state.products];
        for (const item of order.items) {
          const dish = state.dishes.find((d) => d.id === item.dishId);
          if (!dish) continue;
          for (const ing of dish.ingredients) {
            const pIdx = updatedProducts.findIndex((p) => p.id === ing.productId);
            if (pIdx !== -1) {
              updatedProducts[pIdx] = {
                ...updatedProducts[pIdx],
                quantity: Math.max(0, updatedProducts[pIdx].quantity - ing.quantity * item.quantity),
              };
            }
          }
        }
        set({
          products: updatedProducts,
          orders: state.orders.map((o) => (o.id === id ? { ...o, status: 'confirmed' } : o)),
        });
      },
      addClient: (c) => set((s) => ({ clients: [...s.clients, { ...c, id: genId() }] })),
      updateClient: (id, c) => set((s) => ({ clients: s.clients.map((x) => (x.id === id ? { ...x, ...c } : x)) })),
      deleteClient: (id) => set((s) => ({ clients: s.clients.filter((x) => x.id !== id) })),
    }),
    { name: 'restaurant-store' }
  )
);

export function checkOrderFeasibility(
  items: { dishId: string; quantity: number }[],
  dishes: Dish[],
  products: Product[]
) {
  const needed: Record<string, number> = {};
  for (const item of items) {
    const dish = dishes.find((d) => d.id === item.dishId);
    if (!dish) continue;
    for (const ing of dish.ingredients) {
      needed[ing.productId] = (needed[ing.productId] || 0) + ing.quantity * item.quantity;
    }
  }
  const shortages: { product: Product; needed: number; available: number }[] = [];
  for (const [pid, qty] of Object.entries(needed)) {
    const product = products.find((p) => p.id === pid);
    if (!product || product.quantity < qty) {
      shortages.push({ product: product || { id: pid, name: 'Unknown', quantity: 0, unit: '', minStock: 0 }, needed: qty, available: product?.quantity || 0 });
    }
  }
  return { needed, shortages };
}
