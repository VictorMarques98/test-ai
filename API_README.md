# Kitchen Companion - Backend API Integration

## 🎯 Overview

This project integrates with a NestJS backend API for managing a Kitchen Display System (KDS). The frontend uses React + TypeScript + Zustand, and communicates with the backend via REST API calls.

## 🏗️ Project Structure

```
src/
├── lib/
│   ├── api.ts              # Axios client configuration
│   ├── apiTest.ts          # API connectivity tests
│   └── utils.ts            # Utility functions
├── services/
│   ├── itemsService.ts     # Items CRUD
│   ├── productsService.ts  # Products CRUD
│   ├── stockService.ts     # Stock management
│   ├── ordersService.ts    # Orders management
│   └── index.ts            # Service exports
├── store/
│   ├── restaurantStoreApi.ts  # New API-based store
│   └── restaurantStore.ts     # Old local store (deprecated)
├── types/
│   ├── api.ts              # Backend DTOs
│   └── restaurant.ts       # UI types
├── hooks/
│   └── useStoreData.ts     # Custom hooks for store
└── components/             # React components
```

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Backend URL
Create a `.env` file:
```env
VITE_API_BASE_URL=http://localhost:3000
```

### 3. Start Backend Server
Make sure your NestJS backend is running on the configured port (default: 3000)

### 4. Start Frontend
```bash
npm run dev
```

## 📡 API Endpoints

### Items (Raw Ingredients)
- `GET /items` - List all items
- `POST /items` - Create item
- `GET /items/:id` - Get item
- `PATCH /items/:id` - Update item
- `DELETE /items/:id` - Delete item

### Products (Dishes)
- `GET /products` - List all products
- `POST /products` - Create product
- `GET /products/:id` - Get product
- `PATCH /products/:id` - Update product
- `DELETE /products/:id` - Delete product

### Stock (Inventory)
- `GET /stock` - List all stock
- `POST /stock` - Create stock entry
- `PATCH /stock/:id` - Update stock quantity
- `GET /stock/:id` - Get stock by ID
- `GET /stock/item/:itemId` - Get stock by item ID

### Orders
- `GET /orders` - List all orders
- `POST /orders` - Create order
- `GET /orders/:id` - Get order
- `PATCH /orders/:id/status` - Update order status

## 💻 Usage Examples

### Basic Component with Data Fetching

```typescript
import { useEffect } from 'react';
import { useRestaurantStore } from '@/store/restaurantStoreApi';

function ItemsList() {
  const { items, isLoading, error, fetchItems } = useRestaurantStore();

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <ul>
      {items.map(item => (
        <li key={item.id}>{item.name}</li>
      ))}
    </ul>
  );
}
```

### Using Custom Hooks

```typescript
import { useInitializeData } from '@/hooks/useStoreData';
import { useRestaurantStore } from '@/store/restaurantStoreApi';

function Dashboard() {
  const { isLoading, error } = useInitializeData();
  const { items, products, orders } = useRestaurantStore();

  if (isLoading) return <Spinner />;
  if (error) return <ErrorPage />;

  return <DashboardView data={{ items, products, orders }} />;
}
```

### Creating Items

```typescript
const { createItem } = useRestaurantStore();

const handleSubmit = async (data) => {
  try {
    await createItem({
      name: data.name,
      unit_type: data.unitType, // 'grams' | 'unit'
      description: data.description,
    });
    toast.success('Item created!');
  } catch (error) {
    toast.error('Failed to create item');
  }
};
```

### Managing Stock

```typescript
const { createStock, updateStock } = useRestaurantStore();

// Create stock for new item
await createStock({
  itemId: '...',
  quantity: 100,
});

// Update stock quantity
await updateStock(stockId, {
  quantity: 250, // New quantity (replaces current)
});
```

### Creating Orders

```typescript
const { createOrder } = useRestaurantStore();

await createOrder({
  customer_name: 'John Doe',
  notes: 'Extra cheese',
  products: [
    'product-id-1',  // First product
    'product-id-1',  // Same product (qty: 2)
    'product-id-2',  // Different product
  ],
});
```

## 🔄 Order Status Flow

Orders follow a strict state machine:

```
request ──┬─→ in_progress ──┬─→ finish
          │                 │
          └─→ refuse        └─→ canceled
```

Valid transitions:
- `request` → `in_progress` (accept order)
- `request` → `refuse` (reject order)
- `in_progress` → `finish` (complete order)
- `in_progress` → `canceled` (cancel order)

```typescript
const { updateOrderStatus } = useRestaurantStore();

// Accept order
await updateOrderStatus(orderId, 'in_progress');

// Complete order
await updateOrderStatus(orderId, 'finish');
```

## 🎨 Store API Reference

### State
```typescript
{
  items: Item[]
  products: Product[]
  stock: Stock[]
  orders: Order[]
  clients: Client[]  // Local only
  isLoading: boolean
  error: string | null
}
```

### Actions

#### Items
- `fetchItems()` - Load all items
- `createItem(data)` - Create new item
- `updateItem(id, data)` - Update item
- `deleteItem(id)` - Delete item

#### Products
- `fetchProducts()` - Load all products
- `createProduct(data)` - Create new product
- `updateProduct(id, data)` - Update product
- `deleteProduct(id)` - Delete product

#### Stock
- `fetchStock()` - Load all stock
- `createStock(data)` - Create stock entry
- `updateStock(id, data)` - Update stock quantity
- `getStockByItemId(itemId)` - Get stock for item

#### Orders
- `fetchOrders()` - Load all orders
- `createOrder(data)` - Create new order
- `updateOrderStatus(id, status)` - Update order status

#### Utilities
- `setError(message)` - Set error message
- `clearError()` - Clear error
- `getLowStockItems(threshold)` - Get items below threshold

## 🧪 Testing API Connectivity

### Browser Console Test
```typescript
import { runApiTests } from '@/lib/apiTest';
runApiTests();
```

### Manual Service Test
```typescript
import { itemsService } from '@/services';

itemsService.getAll()
  .then(items => console.log(items))
  .catch(err => console.error(err));
```

## 🔧 Configuration

### Environment Variables
- `VITE_API_BASE_URL` - Backend API base URL (default: http://localhost:3000)

### API Client Settings
Edit `src/lib/api.ts` to customize:
- Timeout (default: 10000ms)
- Headers
- Interceptors
- Error handling

## 📚 Documentation

- **[INTEGRATION_SUMMARY.md](./INTEGRATION_SUMMARY.md)** - Complete overview
- **[BACKEND_MIGRATION_GUIDE.md](./BACKEND_MIGRATION_GUIDE.md)** - Full migration guide
- **[API_QUICK_REFERENCE.md](./API_QUICK_REFERENCE.md)** - Quick reference
- **[docs/example-inventory-component.tsx](./docs/example-inventory-component.tsx)** - Example component

## ⚠️ Important Notes

1. **All operations are async** - Always use `async/await` or `.then()`
2. **Error handling is required** - Wrap API calls in try-catch
3. **Loading states** - Use `isLoading` for better UX
4. **Stock updates replace** - Not incremental (calculate new value)
5. **Products need items** - Create items before products
6. **Orders use products** - Not items directly

## 🐛 Troubleshooting

### Backend Connection Issues
- ✅ Backend server is running
- ✅ CORS is configured on backend
- ✅ `.env` has correct URL
- ✅ Port matches backend

### Type Errors
- ✅ Using types from `@/types/api`
- ✅ Backend response matches DTOs
- ✅ Optional fields handled properly

### State Not Updating
- ✅ Using `async/await` properly
- ✅ Calling fetch functions on mount
- ✅ Checking browser console for errors

## 🚀 Deployment

### Frontend
```bash
npm run build
# Deploy dist/ folder
```

### Environment Variables
Production `.env`:
```env
VITE_API_BASE_URL=https://api.yourbackend.com
```

## 📦 Dependencies

Main dependencies for API integration:
- `axios` - HTTP client
- `zustand` - State management
- `typescript` - Type safety

## 🤝 Contributing

When adding new API features:
1. Add types to `src/types/api.ts`
2. Create service in `src/services/`
3. Add store actions in `src/store/restaurantStoreApi.ts`
4. Update documentation

## 📝 License

[Your License Here]

## 👥 Team

[Your Team Info]

---

**Happy Coding! 🎉**
