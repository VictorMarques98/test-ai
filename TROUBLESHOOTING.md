# Troubleshooting Guide

## Common Issues & Solutions

### 🔴 Backend Connection Errors

#### Problem: "Network Error" or "Failed to fetch"
**Symptoms:**
- All API calls fail
- Error message: "Network error - please check your connection"
- Console shows CORS errors

**Solutions:**
1. **Check backend is running**
   ```bash
   # Make sure backend server is active
   curl http://localhost:3000
   ```

2. **Verify .env configuration**
   ```env
   # .env file
   VITE_API_BASE_URL=http://localhost:3000
   ```

3. **Check CORS on backend**
   Backend needs to allow frontend origin:
   ```typescript
   // Backend: main.ts (NestJS)
   app.enableCors({
     origin: 'http://localhost:5173', // Vite dev server
     credentials: true,
   });
   ```

4. **Restart dev server**
   ```bash
   # Stop current dev server (Ctrl+C)
   npm run dev
   ```

---

### 🔴 Type Errors

#### Problem: TypeScript errors about missing properties
**Symptoms:**
- "Property 'unit_type' does not exist on type 'Product'"
- Type mismatches between backend and frontend

**Solutions:**
1. **Check types match backend**
   Compare `src/types/api.ts` with backend DTOs

2. **Handle optional fields**
   ```typescript
   // Use optional chaining
   const desc = product.description ?? 'No description';
   const items = product.product_items ?? [];
   ```

3. **Update types if backend changed**
   If backend API changed, update `src/types/api.ts`

---

### 🔴 Store Not Updating

#### Problem: UI doesn't reflect changes after API call
**Symptoms:**
- Create/update/delete succeeds but UI unchanged
- Need to refresh page to see changes

**Solutions:**
1. **Check async/await usage**
   ```typescript
   // ❌ Wrong - missing await
   createItem(data);
   
   // ✅ Correct
   await createItem(data);
   ```

2. **Verify fetch on mount**
   ```typescript
   useEffect(() => {
     fetchItems();
   }, [fetchItems]);
   ```

3. **Check component re-renders**
   ```typescript
   // Make sure you're using store values
   const { items } = useRestaurantStore();
   
   // Component will re-render when items change
   return <div>{items.length} items</div>;
   ```

---

### 🔴 Loading States Stuck

#### Problem: `isLoading` stays true forever
**Symptoms:**
- Spinner never stops
- UI frozen in loading state

**Solutions:**
1. **Check for API errors**
   ```typescript
   // Open browser console
   // Look for red error messages
   ```

2. **Verify backend returns response**
   ```bash
   # Test endpoint directly
   curl http://localhost:3000/items
   ```

3. **Add timeout handling**
   ```typescript
   // In component
   useEffect(() => {
     const timeout = setTimeout(() => {
       if (isLoading) {
         console.error('Request timeout');
         clearError();
       }
     }, 15000); // 15 second timeout
     
     return () => clearTimeout(timeout);
   }, [isLoading]);
   ```

---

### 🔴 401/403 Authentication Errors

#### Problem: "Unauthorized" or "Forbidden"
**Symptoms:**
- 401 or 403 status codes
- Backend requires authentication

**Solutions:**
1. **Log in** at `/auth/login` (route `#/auth/login`). The app stores the access and refresh tokens and sends the access token on every request.
2. If you see 401 after being logged in, the app will try to refresh the token via `POST /auth/refresh`. If refresh fails, you will be redirected to the login page—log in again.

---

### 🔴 400 Bad Request

#### Problem: "Dados inválidos" (Invalid data)
**Symptoms:**
- Create/update operations fail with 400
- Backend rejects request

**Solutions:**
1. **Check required fields**
   ```typescript
   // Items require: name, unit_type
   await createItem({
     name: 'Tomato',        // ✅ Required
     unit_type: 'grams',    // ✅ Required
     description: null,     // ✅ Optional
   });
   ```

2. **Validate data types**
   ```typescript
   // Make sure types match
   unit_type: 'grams' | 'unit'  // ✅ String literal
   quantity: 100                 // ✅ Number, not string
   ```

3. **Check product items**
   ```typescript
   // Products need valid item IDs
   await createProduct({
     name: 'Burger',
     items: [
       { 
         itemId: 'valid-uuid-here',  // ✅ Existing item
         quantity: 200               // ✅ Number > 0
       }
     ]
   });
   ```

---

### 🔴 404 Not Found

#### Problem: "Item não encontrado" (Item not found)
**Symptoms:**
- Get/update/delete by ID fails
- 404 status code

**Solutions:**
1. **Verify ID exists**
   ```typescript
   // Check ID is valid UUID
   console.log('Deleting item:', itemId);
   ```

2. **Refresh data first**
   ```typescript
   // Fetch latest data before operations
   await fetchItems();
   const item = items.find(i => i.id === targetId);
   ```

3. **Handle missing items gracefully**
   ```typescript
   try {
     await deleteItem(id);
   } catch (error) {
     if (error.statusCode === 404) {
       console.log('Item already deleted');
       // Refresh list
       await fetchItems();
     }
   }
   ```

---

### 🔴 409 Conflict

#### Problem: "Stock already exists for this item"
**Symptoms:**
- Can't create stock for item
- 409 status code

**Solutions:**
1. **Check if stock exists first**
   ```typescript
   const existingStock = await getStockByItemId(itemId);
   
   if (existingStock) {
     // Update existing
     await updateStock(existingStock.id, { quantity: 100 });
   } else {
     // Create new
     await createStock({ itemId, quantity: 100 });
   }
   ```

---

### 🔴 Order Status Transition Errors

#### Problem: "Transição de status inválida"
**Symptoms:**
- Can't change order status
- 400 error on status update

**Solutions:**
1. **Follow state machine**
   ```
   request → in_progress or refuse
   in_progress → finish or canceled
   ```

2. **Check current status first**
   ```typescript
   const order = orders.find(o => o.id === orderId);
   
   if (order.status === 'request') {
     // Can accept or refuse
     await updateOrderStatus(orderId, 'in_progress');
   } else if (order.status === 'in_progress') {
     // Can finish or cancel
     await updateOrderStatus(orderId, 'finish');
   }
   ```

---

### 🔴 Stock Insufficient

#### Problem: "Estoque insuficiente" when creating order
**Symptoms:**
- Can't create order
- 400 error about stock

**Solutions:**
1. **Check available stock**
   ```typescript
   const { stock } = useRestaurantStore();
   
   // Calculate available (not reserved)
   const available = stock.quantity - stock.reserved_quantity;
   ```

2. **Add stock first**
   ```typescript
   // Increase stock before ordering
   await updateStock(stockId, {
     quantity: currentQuantity + 1000
   });
   ```

3. **Reduce order quantity**
   ```typescript
   // Order fewer products
   await createOrder({
     products: ['product-id'] // Only 1 instead of 5
   });
   ```

---

## Debugging Tools

### Browser DevTools

#### Network Tab
1. Open DevTools (F12 or Cmd+Option+I)
2. Go to Network tab
3. Filter by "Fetch/XHR"
4. See all API requests/responses

**What to check:**
- Request URL (correct endpoint?)
- Status code (200 OK? 404? 500?)
- Request payload (correct data?)
- Response data (what backend returned?)

#### Console Tab
- Check for error messages
- Run test commands
- Inspect store state

```typescript
// In browser console
import { useRestaurantStore } from '@/store/restaurantStoreApi';

// Get current state
const state = useRestaurantStore.getState();
console.log('Items:', state.items);
console.log('Error:', state.error);
```

### API Test Script

Run connectivity tests:
```typescript
import { runApiTests } from '@/lib/apiTest';
await runApiTests();
```

### Direct Service Testing

Test services directly:
```typescript
import { itemsService } from '@/services';

// Test in browser console
itemsService.getAll()
  .then(items => console.log('Success:', items))
  .catch(err => console.error('Error:', err));
```

---

## Performance Issues

### Slow API Calls

**Solutions:**
1. **Check backend performance**
2. **Add loading indicators**
   ```typescript
   {isLoading && <Spinner />}
   ```
3. **Implement pagination** (future enhancement)

### Too Many Re-renders

**Solutions:**
1. **Memoize callbacks**
   ```typescript
   const handleClick = useCallback(async () => {
     await createItem(data);
   }, [data]);
   ```

2. **Use specific selectors**
   ```typescript
   // ❌ Re-renders on any state change
   const state = useRestaurantStore();
   
   // ✅ Only re-renders when items change
   const items = useRestaurantStore(state => state.items);
   ```

---

## Environment Issues

### Production Build Fails

**Solutions:**
1. **Check TypeScript errors**
   ```bash
   npm run build
   # Fix all TypeScript errors
   ```

2. **Verify environment variables**
   ```bash
   # Production .env
   VITE_API_BASE_URL=https://api.production.com
   ```

3. **Test build locally**
   ```bash
   npm run build
   npm run preview
   ```

---

## Getting Help

### Steps to Debug:
1. ✅ Check browser console for errors
2. ✅ Check Network tab for failed requests
3. ✅ Verify backend is running
4. ✅ Test API with curl/Postman
5. ✅ Check this troubleshooting guide
6. ✅ Review example component

### When Asking for Help:
Include:
- Error message (exact text)
- Browser console screenshot
- Network tab screenshot
- Code snippet causing issue
- Steps to reproduce

### Useful Commands:
```bash
# Check if backend is responding
curl http://localhost:3000/items

# See all environment variables
env | grep VITE

# Clear npm cache
npm cache clean --force

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Restart dev server
# Ctrl+C
npm run dev
```

---

## Prevention Tips

### Best Practices:
1. ✅ Always use try-catch with API calls
2. ✅ Show loading states
3. ✅ Display error messages
4. ✅ Validate data before sending
5. ✅ Handle edge cases (empty arrays, null values)
6. ✅ Test in browser DevTools
7. ✅ Keep types synchronized with backend

### Code Template:
```typescript
const MyComponent = () => {
  const { data, isLoading, error, fetchData } = useRestaurantStore();

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (isLoading) return <Spinner />;
  if (error) return <ErrorDisplay error={error} />;
  if (!data.length) return <EmptyState />;

  return <DataDisplay data={data} />;
};
```

---

**Still stuck? Check the documentation files:**
- `BACKEND_MIGRATION_GUIDE.md`
- `API_QUICK_REFERENCE.md`
- `DATA_MODEL.md`
- `docs/example-inventory-component.tsx`
