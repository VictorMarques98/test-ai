/**
 * Centralized exports for all API services
 * Use this to import services in a consistent way
 */

export { default as itemsService } from './itemsService';
export { default as productsService } from './productsService';
export { default as stockService } from './stockService';
export { default as ordersService } from './ordersService';

// Re-export individual services for destructured imports
export { itemsService } from './itemsService';
export { productsService } from './productsService';
export { stockService } from './stockService';
export { ordersService } from './ordersService';
