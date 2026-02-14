export interface Product {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  minStock: number;
}

export interface DishIngredient {
  productId: string;
  quantity: number;
}

export interface Dish {
  id: string;
  name: string;
  price: number;
  ingredients: DishIngredient[];
}

export interface OrderItem {
  dishId: string;
  quantity: number;
}

export interface Order {
  id: string;
  items: OrderItem[];
  createdAt: string;
  status: 'pending' | 'confirmed' | 'completed';
}
