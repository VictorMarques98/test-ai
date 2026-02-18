# Backend API Integration - Migration Guide

## Overview
This project has been migrated from local state management to integrate with a Swagger/OpenAPI backend API.

## What Changed

### 1. **New Dependencies**
- **axios**: HTTP client for making API calls

### 2. **New Files Created**

#### API Configuration
- **`.env`**: Environment variables (API base URL)
- **`src/lib/api.ts`**: Axios instance with interceptors for error handling

#### Type Definitions
- **`src/types/api.ts`**: TypeScript types matching the backend DTOs
- **`src/types/restaurant.ts`**: Updated to re-export API types

#### API Services
- **`src/services/itemsService.ts`**: CRUD operations for items (ingredients)
- **`src/services/productsService.ts`**: CRUD operations for products (dishes)
- **`src/services/stockService.ts`**: Stock/inventory management
- **`src/services/ordersService.ts`**: Order creation and status management

#### Store
- **`src/store/restaurantStoreApi.ts`**: New Zustand store using async API calls
- **`src/store/restaurantStore.ts`**: Old store (preserved for reference)

## API Endpoints

### Items (Ingredients/Raw Materials)
```typescript
GET    /items          - List all items
POST   /items          - Create item
GET    /items/:id      - Get item by ID
PATCH  /items/:id      - Update item
DELETE /items/:id      - Delete item
```

### Products (Dishes made from items)
```typescript
GET    /products       - List all products
POST   /products       - Create product
GET    /products/:id   - Get product by ID
PATCH  /products/:id   - Update product
DELETE /products/:id   - Delete product
```

### Stock (Inventory)
```typescript
GET    /stock              - List all stock
POST   /stock              - Create stock for an item
PATCH  /stock/:id          - Update stock quantity
GET    /stock/:id          - Get stock by ID
GET    /stock/item/:itemId - Get stock by item ID
```

### Orders
```typescript
GET    /orders              - List all orders
POST   /orders              - Create order
GET    /orders/:id          - Get order by ID
PATCH  /orders/:id/status   - Update order status
```

## How to Use the New Store

### 1. Configuration
Update your **`.env`** file with your backend URL:
```env
VITE_API_BASE_URL=http://localhost:3000
```

### 2. Using the Store in Components

#### Import the new store
```typescript
import { useRestaurantStore } from '@/store/restaurantStoreApi';
```

#### Fetch data on component mount
```typescript
import { useEffect } from 'react';
import { useRestaurantStore } from '@/store/restaurantStoreApi';

function MyComponent() {
  const { items, isLoading, error, fetchItems } = useRestaurantStore();

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      {items.map(item => (
        <div key={item.id}>{item.name}</div>
      ))}
    </div>
  );
}
```

#### Create operations
```typescript
const { createItem } = useRestaurantStore();

const handleCreateItem = async () => {
  try {
    await createItem({
      name: 'Tomato',
      unit_type: 'grams',
      description: 'Fresh tomatoes',
    });
  } catch (error) {
    console.error('Failed to create item:', error);
  }
};
```

#### Update operations
```typescript
const { updateItem } = useRestaurantStore();

const handleUpdateItem = async (id: string) => {
  try {
    await updateItem(id, {
      name: 'Cherry Tomato',
    });
  } catch (error) {
    console.error('Failed to update item:', error);
  }
};
```

#### Delete operations
```typescript
const { deleteItem } = useRestaurantStore();

const handleDeleteItem = async (id: string) => {
  try {
    await deleteItem(id);
  } catch (error) {
    console.error('Failed to delete item:', error);
  }
};
```

### 3. Creating Products with Items

Products are composed of items. Here's how to create one:

```typescript
const { createProduct } = useRestaurantStore();

const handleCreateProduct = async () => {
  try {
    await createProduct({
      name: 'Hamburger',
      description: 'Delicious burger',
      price: 25.90,
      buyPrice: 12.50,
      items: [
        { itemId: 'item-uuid-1', quantity: 200 }, // 200g of beef
        { itemId: 'item-uuid-2', quantity: 1 },   // 1 bun
        { itemId: 'item-uuid-3', quantity: 50 },  // 50g of cheese
      ],
    });
  } catch (error) {
    console.error('Failed to create product:', error);
  }
};
```

### 4. Managing Stock

```typescript
const { createStock, updateStock, getStockByItemId } = useRestaurantStore();

// Create initial stock for an item
const handleCreateStock = async (itemId: string) => {
  try {
    await createStock({
      itemId: itemId,
      quantity: 1000, // Initial quantity in item's unit
    });
  } catch (error) {
    console.error('Failed to create stock:', error);
  }
};

// Update stock quantity
const handleUpdateStock = async (stockId: string, newQuantity: number) => {
  try {
    await updateStock(stockId, {
      quantity: newQuantity, // Replaces current quantity
    });
  } catch (error) {
    console.error('Failed to update stock:', error);
  }
};
```

### 5. Creating and Managing Orders

```typescript
const { createOrder, updateOrderStatus } = useRestaurantStore();

// Create order with products
const handleCreateOrder = async () => {
  try {
    await createOrder({
      customer_name: 'John Doe',
      notes: 'No onions please',
      products: [
        'product-uuid-1', // Hamburger
        'product-uuid-1', // Another hamburger
        'product-uuid-2', // Fries
      ],
    });
  } catch (error) {
    console.error('Failed to create order:', error);
  }
};

// Update order status
const handleAcceptOrder = async (orderId: string) => {
  try {
    // From 'request' to 'in_progress'
    await updateOrderStatus(orderId, 'in_progress');
  } catch (error) {
    console.error('Failed to accept order:', error);
  }
};

const handleCompleteOrder = async (orderId: string) => {
  try {
    // From 'in_progress' to 'finish'
    await updateOrderStatus(orderId, 'finish');
  } catch (error) {
    console.error('Failed to complete order:', error);
  }
};
```

## Order Status Flow

The backend enforces specific status transitions:

1. **request** → **in_progress** or **refuse**
2. **in_progress** → **finish** or **canceled**

Invalid transitions will return a 400 error.

## Error Handling

All API calls are wrapped with try-catch. The store provides:
- `isLoading`: Boolean indicating if an operation is in progress
- `error`: String with error message if an operation fails
- `clearError()`: Function to clear error state

```typescript
const { error, clearError, isLoading } = useRestaurantStore();

useEffect(() => {
  if (error) {
    // Show error toast/notification
    console.error(error);
    // Clear after showing
    setTimeout(clearError, 3000);
  }
}, [error, clearError]);
```

## Migration Checklist

- [ ] Update `.env` with your backend URL
- [ ] Start your backend server
- [ ] Replace imports from `@/store/restaurantStore` to `@/store/restaurantStoreApi`
- [ ] Update components to handle async operations (add try-catch, loading states)
- [ ] Update components to use new data structures (items, products, stock, orders)
- [ ] Test all CRUD operations
- [ ] Update UI to show loading and error states
- [ ] Remove old `restaurantStore.ts` once migration is complete

## Key Differences

### Old Store (Local)
- Synchronous operations
- Data stored locally in Zustand/Electron DB
- Immediate updates

### New Store (API)
- **Asynchronous** operations (use `async/await`)
- Data stored on backend server
- Network latency
- Requires error handling
- Requires loading states

## Backend Requirements

Make sure your backend server is running and accessible at the URL specified in `.env`.

Default: `http://localhost:3000`

## Testing

You can test the API integration by:
1. Starting the backend server
2. Running the development server: `npm run dev`
3. Opening the browser console to monitor API calls
4. Using browser DevTools Network tab to inspect requests/responses

## Example: Complete Component

See **`/docs/example-inventory-component.tsx`** for a complete example of a component using the new API-based store.
