# Kitchen Display System - API Endpoints Documentation

This document provides a comprehensive overview of all backend API endpoints available in the Kitchen Display System.

## Base URL
- **Development**: Proxied through `/api`
- **Production**: Set via `VITE_API_BASE_URL` environment variable

## Authentication
All endpoints require Bearer token authentication using API key:
```
Authorization: Bearer YOUR_API_KEY
```

---

## 📦 Items Endpoints

Items are basic ingredients/materials used to create products (e.g., tomatoes, cheese, flour).

### GET /items
**Purpose**: List all items in the system  
**Response**: Array of items with id, name, description, unit_type  
**Use Case**: Display inventory items, populate ingredient dropdowns

### GET /items/{id}
**Purpose**: Get specific item details by UUID  
**Parameters**: `id` (path) - Item UUID  
**Response**: Single item object  
**Use Case**: View item details, edit item form

### POST /items
**Purpose**: Create a new item  
**Body**: `CreateItemDto`
- `name` (required): Item name (max 255 chars)
- `description` (optional): Additional details
- `unit_type` (required): One of: "grams", "unit", "ml", "liters", "kg"

**Response**: Created item with assigned UUID  
**Use Case**: Add new ingredients to the system

### PATCH /items/{id}
**Purpose**: Update an existing item  
**Parameters**: `id` (path) - Item UUID  
**Body**: `UpdateItemDto` (all fields optional)  
**Response**: Updated item  
**Use Case**: Modify item details or unit type

### DELETE /items/{id}
**Purpose**: Remove an item from the system  
**Parameters**: `id` (path) - Item UUID  
**Response**: 204 No Content  
**Use Case**: Delete unused items

---

## 👥 Customers Endpoints

Customers represent clients who place orders.

### GET /customers
**Purpose**: List all customers  
**Response**: Array of customers  
**Use Case**: Display customer list, populate customer dropdowns

### GET /customers/{id}
**Purpose**: Get specific customer by UUID  
**Parameters**: `id` (path) - Customer UUID  
**Response**: Single customer object  
**Use Case**: View customer profile, link to orders

### POST /customers
**Purpose**: Create a new customer  
**Body**: `CreateCustomerDto`
- `name` (required): Customer name (max 255 chars)
- `phone` (optional): Phone number (max 50 chars)
- `email` (optional): Email address (max 255 chars)
- `address` (optional): Physical or delivery address

**Response**: Created customer with assigned UUID  
**Use Case**: Register new customers

### PATCH /customers/{id}
**Purpose**: Update customer information  
**Parameters**: `id` (path) - Customer UUID  
**Body**: `UpdateCustomerDto` (all fields optional)  
**Response**: Updated customer  
**Use Case**: Update contact details

### DELETE /customers/{id}
**Purpose**: Remove a customer  
**Parameters**: `id` (path) - Customer UUID  
**Response**: 204 No Content  
**Use Case**: Delete customer records

---

## 📊 Stock Endpoints

Stock tracks inventory levels for each item, including quantity, reserved amounts, and alerts.

### GET /stock
**Purpose**: List all stock entries  
**Response**: Array with id, item_id, quantity, reserved_quantity, alert_quantity, unitType  
**Use Case**: View inventory dashboard, check stock levels

### GET /stock/{id}
**Purpose**: Get stock entry by stock ID  
**Parameters**: `id` (path) - Stock UUID  
**Response**: Stock object  
**Use Case**: View specific stock details

### GET /stock/item/{itemId}
**Purpose**: Get stock for a specific item  
**Parameters**: `itemId` (path) - Item UUID  
**Response**: Stock object for that item  
**Use Case**: Check item availability before creating products/orders

### POST /stock
**Purpose**: Create stock entry for an item  
**Body**: `CreateStockDto`
- `itemId` (required): UUID of the item
- `quantity` (required): Initial quantity (min 0.0001)
- `alert_quantity` (optional): Alert threshold

**Response**: Created stock entry  
**Constraints**: Only one stock entry per item (409 Conflict if exists)  
**Use Case**: Initialize inventory for a new item

### PATCH /stock/{id}
**Purpose**: Add or remove quantity from stock  
**Parameters**: `id` (path) - Stock UUID  
**Body**: `UpdateStockDto`
- `operation` (required): "add" (incoming) or "remove" (outgoing)
- `quantity` (required): Amount to add/subtract (always positive, min 0.0001)
- `alert_quantity` (optional): Update alert threshold

**Response**: Updated stock entry  
**Side Effect**: Creates a history record automatically  
**Use Case**: Receive shipments (add), fulfill orders (remove)

### GET /stock/history
**Purpose**: List all stock movement history  
**Response**: Array of history entries (id, stock_id, quantity, operation, item_name, created_at)  
**Ordering**: Newest first (created_at DESC)  
**Use Case**: Audit trail, inventory reports

---

## 🍔 Products Endpoints

Products are composed of multiple items (e.g., a burger = bun + patty + cheese).

### GET /products
**Purpose**: List all products with their item compositions  
**Response**: Array of products with embedded items array  
**Use Case**: Menu display, product catalog

### GET /products/{id}
**Purpose**: Get specific product details  
**Parameters**: `id` (path) - Product UUID  
**Response**: Product with items composition  
**Use Case**: View recipe, edit product

### POST /products
**Purpose**: Create a new product with item composition  
**Body**: `CreateProductDto`
- `name` (required): Product name (max 255 chars)
- `description` (optional): Product description
- `price` (optional): Selling price (informational)
- `buyPrice` (optional): Cost price (informational)
- `items` (required): Array of `ProductItemDto`:
  - `itemId`: UUID of the item
  - `quantity`: Amount needed (in item's unit_type)

**Response**: Created product  
**Validations**: 
- All items must exist
- Items must have compatible unit types
**Use Case**: Add new menu items

### PATCH /products/{id}
**Purpose**: Update product details or composition  
**Parameters**: `id` (path) - Product UUID  
**Body**: `UpdateProductDto` (all fields optional)  
**Response**: Updated product  
**Use Case**: Modify recipes, update prices

### DELETE /products/{id}
**Purpose**: Remove a product  
**Parameters**: `id` (path) - Product UUID  
**Response**: 204 No Content  
**Use Case**: Discontinue menu items

---

## 🛒 Orders Endpoints

Orders represent customer requests for products. The system automatically calculates required items from product compositions.

### GET /orders
**Purpose**: List all orders  
**Response**: Array of orders with status, products, customer info  
**Use Case**: Kitchen display, order management dashboard

### GET /orders/{id}
**Purpose**: Get specific order details  
**Parameters**: `id` (path) - Order UUID  
**Response**: Complete order object  
**Use Case**: Order details view, status tracking

### POST /orders
**Purpose**: Create a new order  
**Body**: `CreateOrderDto`
- `customerId` (optional): UUID of customer
- `notes` (optional): Special instructions
- `products` (required): Array of product UUIDs
  - **Note**: Repeating the same UUID adds multiple units of that product
  - Example: `["uuid1", "uuid1", "uuid2"]` = 2x product1, 1x product2

**Response**: Created order with status "request"  
**Validations**:
- All products must exist
- Sufficient stock must be available for all required items
**Side Effects**: Automatically calculates and reserves stock for required items  
**Use Case**: Place customer orders

### PATCH /orders/{id}/status
**Purpose**: Update order status with workflow validation  
**Parameters**: `id` (path) - Order UUID  
**Body**: `UpdateOrderStatusDto`
- `status`: One of "in_progress", "refuse", "canceled", "finish"

**Valid Status Transitions**:
- `request` → `in_progress` (accept order)
- `request` → `refuse` (reject order)
- `in_progress` → `finish` (complete order)
- `in_progress` → `canceled` (cancel after accepting)

**Response**: 202 Accepted (status change queued)  
**Use Case**: Kitchen workflow management

---

## 📋 Data Models Summary

### Unit Types
- `grams` - Weight in grams
- `unit` - Countable units (e.g., 1 tomato)
- `ml` - Volume in milliliters
- `liters` - Volume in liters
- `kg` - Weight in kilograms

### Order Status Flow
```
request (initial)
   ├─→ in_progress (accepted)
   │      ├─→ finish (completed)
   │      └─→ canceled (cancelled during prep)
   └─→ refuse (rejected)
```

---

## 🔗 Relationships

- **Items** ← referenced by → **Stock** (1:1)
- **Items** ← composed into → **Products** (Many:Many via ProductItems)
- **Products** ← ordered in → **Orders** (Many:Many)
- **Customers** ← linked to → **Orders** (1:Many)

---

## 💡 Common Use Cases

### Adding a New Menu Item (Product)
1. Create all required items via `POST /items` (if not exists)
2. Create stock entries via `POST /stock` for each item
3. Create product with item composition via `POST /products`

### Processing an Order
1. Create order via `POST /orders` (validates stock automatically)
2. Update status to "in_progress" via `PATCH /orders/{id}/status`
3. Prepare order
4. Update status to "finish" via `PATCH /orders/{id}/status`

### Restocking Inventory
1. Get stock entry via `GET /stock/item/{itemId}`
2. Add quantity via `PATCH /stock/{id}` with `operation: "add"`
3. Check history via `GET /stock/history`

### Monitoring Low Stock
1. Get all stock via `GET /stock`
2. Filter where `quantity ≤ alert_quantity`
3. Alert for reorder

---

## ⚠️ Error Responses

- **400** - Invalid data, validation errors
- **404** - Resource not found
- **409** - Conflict (e.g., stock already exists for item)

All errors return:
```json
{
  "statusCode": number,
  "message": string,
  "error": string
}
```
