# API Integration Quick Reference

## 🚀 Quick Start

1. **Set your backend URL in `.env`**
   ```env
   VITE_API_BASE_URL=http://localhost:3000
   ```

2. **Import the store**
   ```typescript
   import { useRestaurantStore } from '@/store/restaurantStoreApi';
   ```

3. **Fetch data**
   ```typescript
   const { items, fetchItems } = useRestaurantStore();
   
   useEffect(() => {
     fetchItems();
   }, [fetchItems]);
   ```

## 📦 Store API Reference

### State
```typescript
{
  items: Item[]              // All items
  products: Product[]        // All products
  stock: Stock[]            // All stock entries
  orders: Order[]           // All orders
  clients: Client[]         // Clients (local only)
  isLoading: boolean        // Loading state
  error: string | null      // Error message
}
```

### Items (Ingredients)
```typescript
fetchItems()                                    // Get all items
createItem({ name, unit_type, description? })  // Create item
updateItem(id, { name?, unit_type?, ... })     // Update item
deleteItem(id)                                  // Delete item
```

### Products (Dishes)
```typescript
fetchProducts()                                        // Get all products
createProduct({ name, items, price?, buyPrice? })     // Create product
updateProduct(id, { name?, items?, ... })             // Update product
deleteProduct(id)                                      // Delete product
```

### Stock (Inventory)
```typescript
fetchStock()                          // Get all stock
createStock({ itemId, quantity })     // Create stock entry
updateStock(id, { quantity })         // Update stock (replaces quantity)
getStockByItemId(itemId)             // Get stock for specific item
```

### Orders
```typescript
fetchOrders()                                    // Get all orders
createOrder({ products, customer_name?, notes? }) // Create order
updateOrderStatus(id, status)                    // Update order status
```

## 🔄 Order Status Transitions

```
request ──┬──> in_progress ──┬──> finish
          │                  │
          └──> refuse        └──> canceled
```

Valid status values:
- `'in_progress'` - Accept order (from request)
- `'refuse'` - Reject order (from request)
- `'finish'` - Complete order (from in_progress)
- `'canceled'` - Cancel order (from in_progress)

## 📝 Common Patterns

### Loading & Error Handling
```typescript
const { isLoading, error, clearError } = useRestaurantStore();

if (isLoading) return <Spinner />;
if (error) return <ErrorMessage message={error} />;
```

### Create with Error Handling
```typescript
const { createItem } = useRestaurantStore();

const handleCreate = async () => {
  try {
    await createItem({ name: 'Tomato', unit_type: 'grams' });
    // Success!
  } catch (err) {
    // Error is stored in store.error
    console.error('Failed:', err);
  }
};
```

### Update Pattern
```typescript
const { updateProduct } = useRestaurantStore();

await updateProduct(productId, {
  name: 'New Name',
  price: 29.99,
});
```

### Delete Pattern
```typescript
const { deleteItem } = useRestaurantStore();

if (confirm('Delete?')) {
  await deleteItem(itemId);
}
```

## 🏗️ Creating Products with Items

Products are made up of items. Each item has a quantity in its own unit:

```typescript
await createProduct({
  name: 'Cheeseburger',
  price: 25.90,
  buyPrice: 12.50,
  items: [
    { itemId: 'beef-uuid', quantity: 200 },    // 200 grams of beef
    { itemId: 'bun-uuid', quantity: 1 },       // 1 bun (unit)
    { itemId: 'cheese-uuid', quantity: 50 },   // 50 grams of cheese
    { itemId: 'tomato-uuid', quantity: 2 },    // 2 tomato slices (units)
  ],
});
```

## 📊 Stock Management

### Create Stock for New Item
```typescript
// After creating an item
const item = await createItem({ name: 'Flour', unit_type: 'grams' });

// Create stock entry
await createStock({
  itemId: item.id,
  quantity: 5000, // 5000 grams
});
```

### Update Stock
```typescript
// Get current stock
const stock = await getStockByItemId(itemId);

// Update quantity (replaces existing)
await updateStock(stock.id, {
  quantity: 3000, // New quantity
});
```

### Check Low Stock
```typescript
const { getLowStockItems } = useRestaurantStore();

const lowStock = getLowStockItems(100); // Items with < 100 quantity
```

## 🛒 Creating Orders

Orders are created with product IDs. Repeat IDs for multiple quantities:

```typescript
await createOrder({
  customer_name: 'John Doe',
  notes: 'Extra cheese, no onions',
  products: [
    'burger-uuid',      // 1 burger
    'burger-uuid',      // Another burger
    'fries-uuid',       // 1 fries
    'soda-uuid',        // 1 soda
  ],
});
```

## 🎯 Complete Example

```typescript
import { useEffect } from 'react';
import { useRestaurantStore } from '@/store/restaurantStoreApi';

function InventoryPage() {
  const {
    items,
    stock,
    isLoading,
    error,
    fetchItems,
    fetchStock,
    createItem,
    createStock,
  } = useRestaurantStore();

  // Load data on mount
  useEffect(() => {
    Promise.all([fetchItems(), fetchStock()]);
  }, []);

  const handleAddItem = async () => {
    try {
      // Create item
      const newItem = await createItem({
        name: 'Tomato',
        unit_type: 'grams',
      });

      // Create stock for item
      await createStock({
        itemId: newItem.id,
        quantity: 1000,
      });
    } catch (err) {
      console.error('Failed to add item:', err);
    }
  };

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <button onClick={handleAddItem}>Add Item</button>
      {items.map((item) => {
        const itemStock = stock.find((s) => s.item_id === item.id);
        return (
          <div key={item.id}>
            {item.name} - Stock: {itemStock?.quantity || 0}
          </div>
        );
      })}
    </div>
  );
}
```

## 🔍 Debugging

### Check API Calls
Open browser DevTools → Network tab to see all API requests

### Log Errors
```typescript
const { error } = useRestaurantStore();

useEffect(() => {
  if (error) console.error('Store error:', error);
}, [error]);
```

### Test API Directly
```typescript
import { itemsService } from '@/services';

// Test outside of React
itemsService.getAll().then(console.log).catch(console.error);
```

## ⚠️ Important Notes

1. **All operations are async** - Use `async/await` or `.then()`
2. **Stock quantities replace** - Not incremental (use `quantity + delta` if needed)
3. **Products need items** - Create items first, then products
4. **Orders use product IDs** - Not item IDs
5. **Status transitions are strict** - Follow the state machine

## 🔗 Links

- Full Migration Guide: `/BACKEND_MIGRATION_GUIDE.md`
- Example Component: `/docs/example-inventory-component.tsx`
- API Types: `/src/types/api.ts`
- Services: `/src/services/`
