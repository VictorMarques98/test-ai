import { useEffect } from 'react';
import { useRestaurantStore } from '@/store/restaurantStoreApi';

/**
 * Custom hook to automatically fetch all data on mount
 * Simplifies data loading in components
 * 
 * @example
 * function MyComponent() {
 *   const { isLoading, error } = useInitializeData();
 *   
 *   if (isLoading) return <Spinner />;
 *   if (error) return <Error />;
 *   
 *   // Data is loaded, use store normally
 *   const { items, products } = useRestaurantStore();
 *   return <div>...</div>;
 * }
 */
export function useInitializeData() {
  const { 
    isLoading, 
    error,
    fetchItems, 
    fetchProducts, 
    fetchStock, 
    fetchOrders 
  } = useRestaurantStore();

  useEffect(() => {
    const loadAllData = async () => {
      try {
        await Promise.all([
          fetchItems(),
          fetchProducts(),
          fetchStock(),
          fetchOrders(),
        ]);
      } catch (err) {
        console.error('Failed to load data:', err);
      }
    };

    loadAllData();
  }, [fetchItems, fetchProducts, fetchStock, fetchOrders]);

  return { isLoading, error };
}

/**
 * Custom hook to fetch specific data types
 * More granular control than useInitializeData
 * 
 * @example
 * // Only fetch items and stock
 * useInitializeData(['items', 'stock']);
 */
export function useInitializeSpecific(types: Array<'items' | 'products' | 'stock' | 'orders'>) {
  const { 
    isLoading, 
    error,
    fetchItems, 
    fetchProducts, 
    fetchStock, 
    fetchOrders 
  } = useRestaurantStore();

  useEffect(() => {
    const loadData = async () => {
      try {
        const promises: Promise<void>[] = [];
        
        if (types.includes('items')) promises.push(fetchItems());
        if (types.includes('products')) promises.push(fetchProducts());
        if (types.includes('stock')) promises.push(fetchStock());
        if (types.includes('orders')) promises.push(fetchOrders());
        
        await Promise.all(promises);
      } catch (err) {
        console.error('Failed to load data:', err);
      }
    };

    loadData();
  }, [types, fetchItems, fetchProducts, fetchStock, fetchOrders]);

  return { isLoading, error };
}

/**
 * Hook to get item with its stock info
 * Useful for inventory displays
 */
export function useItemWithStock(itemId: string) {
  const { items, stock } = useRestaurantStore();
  
  const item = items.find(i => i.id === itemId);
  const itemStock = stock.find(s => s.item_id === itemId);
  
  return { item, stock: itemStock };
}

/**
 * Hook to get product with full item details
 * Resolves product_items to include full item objects
 */
export function useProductWithDetails(productId: string) {
  const { products, items } = useRestaurantStore();
  
  const product = products.find(p => p.id === productId);
  
  if (!product || !product.product_items) {
    return { product, itemsWithDetails: [] };
  }
  
  const itemsWithDetails = product.product_items.map(pi => ({
    ...pi,
    item: items.find(i => i.id === pi.item_id),
  }));
  
  return { product, itemsWithDetails };
}

/**
 * Hook to get all low stock items
 * @param threshold - Quantity threshold (default: 10)
 */
export function useLowStockItems(threshold = 10) {
  const { getLowStockItems } = useRestaurantStore();
  return getLowStockItems(threshold);
}

/**
 * Hook for filtered orders by status
 */
export function useOrdersByStatus(status?: 'request' | 'in_progress' | 'refuse' | 'canceled' | 'finish') {
  const { orders } = useRestaurantStore();
  
  if (!status) return orders;
  
  return orders.filter(order => order.status === status);
}
