# Data Model & Relationships

## Entity Relationships

```
┌─────────────┐
│    Item     │ (Raw ingredients/materials)
│─────────────│
│ id          │
│ name        │
│ description │
│ unit_type   │ ('grams' | 'unit')
└──────┬──────┘
       │
       │ 1:1
       │
┌──────▼──────┐
│    Stock    │ (Inventory tracking)
│─────────────│
│ id          │
│ item_id     │ ◄── FK to Item
│ quantity    │
│ reserved_qty│
└─────────────┘


┌─────────────┐
│    Item     │
└──────┬──────┘
       │
       │ Many:Many (via ProductItem)
       │
┌──────▼──────────┐
│  ProductItem    │ (Junction table)
│─────────────────│
│ id              │
│ product_id      │ ◄── FK to Product
│ item_id         │ ◄── FK to Item
│ quantity        │ (how much item per product)
└──────┬──────────┘
       │
       │ Many:1
       │
┌──────▼──────┐
│   Product   │ (Dishes/Menu items)
│─────────────│
│ id          │
│ name        │
│ description │
│ price       │ (selling price)
│ buyPrice    │ (cost price)
└──────┬──────┘
       │
       │ Many:Many (via Order)
       │
┌──────▼──────┐
│    Order    │ (Customer orders)
│─────────────│
│ id          │
│ customer_nm │
│ notes       │
│ status      │ (request|in_progress|finish|refuse|canceled)
│ created_at  │
└──────┬──────┘
       │
       │ 1:Many
       │
┌──────▼──────┐
│  OrderItem  │ (Items consumed by order)
│─────────────│
│ id          │
│ order_id    │ ◄── FK to Order
│ item_id     │ ◄── FK to Item (derived from products)
│ quantity    │
│ reserved_qty│
└─────────────┘
```

## Data Flow Examples

### Creating a Product

```
1. Create Items (ingredients)
   POST /items { name: "Beef Patty", unit_type: "unit" }
   POST /items { name: "Cheese", unit_type: "grams" }
   
2. Create Stock for Items
   POST /stock { itemId: "beef-id", quantity: 100 }
   POST /stock { itemId: "cheese-id", quantity: 5000 }

3. Create Product with Items
   POST /products {
     name: "Cheeseburger",
     price: 25.90,
     buyPrice: 12.50,
     items: [
       { itemId: "beef-id", quantity: 1 },      // 1 patty
       { itemId: "cheese-id", quantity: 50 }    // 50g cheese
     ]
   }
```

### Creating an Order

```
1. User selects products
   - 2x Cheeseburger
   - 1x Fries

2. Create order with product IDs
   POST /orders {
     customer_name: "John",
     products: [
       "cheeseburger-id",
       "cheeseburger-id",  // Repeat for qty 2
       "fries-id"
     ]
   }

3. Backend:
   - Calculates required items from product_items
   - Reserves stock (reserved_quantity)
   - Creates order_items
   - Returns order with status: "request"

4. Kitchen accepts order
   PATCH /orders/:id/status { status: "in_progress" }
   
5. Kitchen completes order
   PATCH /orders/:id/status { status: "finish" }
   
   Backend:
   - Deducts reserved stock from actual stock
   - Clears reserved_quantity
```

## Stock Management Flow

```
┌─────────────────────────────────────────────┐
│  Initial State                               │
│  Item: Tomatoes (unit_type: grams)          │
│  Stock: quantity=1000, reserved=0            │
└─────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────┐
│  Order Created (needs 200g tomatoes)        │
│  Status: request                             │
│  Stock: quantity=1000, reserved=200          │
│  Available: 800g                             │
└─────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────┐
│  Order Accepted                              │
│  Status: in_progress                         │
│  Stock: quantity=1000, reserved=200          │
│  Available: 800g                             │
└─────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────┐
│  Order Completed                             │
│  Status: finish                              │
│  Stock: quantity=800, reserved=0             │
│  Available: 800g                             │
└─────────────────────────────────────────────┘
```

## Order Status State Machine

```
        ┌─────────┐
   ┌────│ request │────┐
   │    └─────────┘    │
   │                   │
   │ (accept)    (reject)
   │                   │
   ▼                   ▼
┌──────────────┐  ┌────────┐
│ in_progress  │  │ refuse │ (terminal)
└──────────────┘  └────────┘
   │         │
   │         │
(complete) (cancel)
   │         │
   ▼         ▼
┌────────┐ ┌──────────┐
│ finish │ │ canceled │ (terminal)
└────────┘ └──────────┘
```

## Unit Types

Items have `unit_type` which affects quantities:

- **`grams`** - Weight-based (flour, cheese, meat)
  - Quantity in grams (e.g., 250g)
  - Stock in grams
  
- **`unit`** - Count-based (buns, eggs, bottles)
  - Quantity as count (e.g., 5 units)
  - Stock as count

Example:
```json
{
  "name": "Flour",
  "unit_type": "grams",
  "stock": 5000  // 5000 grams (5kg)
}

{
  "name": "Buns",
  "unit_type": "unit",
  "stock": 50  // 50 buns
}
```

## Frontend Type Mapping

```typescript
// Backend → Frontend

// Items
Item (backend) = Item (frontend)
- Same structure

// Products
Product (backend) = Product (frontend)
- product_items array includes full item details

// Stock
Stock (backend) = Stock (frontend)
- Can join with Item for display
- Use StockWithItem helper type

// Orders
Order (backend) = Order (frontend)
- order_items array for consumed items
- products array used for creation
```

## API Response Examples

### GET /items
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Tomato",
    "description": "Fresh tomatoes",
    "unit_type": "grams",
    "created_at": "2024-01-15T10:30:00Z"
  }
]
```

### GET /products
```json
[
  {
    "id": "660e8400-e29b-41d4-a716-446655440000",
    "name": "Cheeseburger",
    "price": 25.90,
    "buyPrice": 12.50,
    "product_items": [
      {
        "id": "770e8400-e29b-41d4-a716-446655440000",
        "product_id": "660e8400-e29b-41d4-a716-446655440000",
        "item_id": "550e8400-e29b-41d4-a716-446655440000",
        "quantity": 200,
        "item": {
          "id": "550e8400-e29b-41d4-a716-446655440000",
          "name": "Beef",
          "unit_type": "grams"
        }
      }
    ]
  }
]
```

### GET /stock
```json
[
  {
    "id": "880e8400-e29b-41d4-a716-446655440000",
    "item_id": "550e8400-e29b-41d4-a716-446655440000",
    "quantity": 5000,
    "reserved_quantity": 200,
    "unitType": "grams"
  }
]
```

### GET /orders
```json
[
  {
    "id": "990e8400-e29b-41d4-a716-446655440000",
    "customer_name": "John Doe",
    "notes": "Extra cheese",
    "status": "in_progress",
    "created_at": "2024-01-15T12:00:00Z",
    "order_items": [
      {
        "id": "aa0e8400-e29b-41d4-a716-446655440000",
        "order_id": "990e8400-e29b-41d4-a716-446655440000",
        "item_id": "550e8400-e29b-41d4-a716-446655440000",
        "quantity": 200,
        "reserved_quantity": 200
      }
    ]
  }
]
```

## Key Concepts

1. **Items** are raw materials (flour, eggs, cheese)
2. **Products** are made FROM items (burger = beef + bun + cheese)
3. **Stock** tracks how much of each item you have
4. **Orders** consume products (which consume items)
5. **Reserved stock** prevents overselling
6. **Unit types** matter - don't mix grams and units!
