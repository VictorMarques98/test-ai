/**
 * API Integration Test Script
 * 
 * Run this in browser console to verify backend connectivity
 * Paste into DevTools console when app is running
 */

import { itemsService, productsService, stockService, ordersService } from './services';

// Test configuration
console.log('🔧 API Base URL:', import.meta.env.VITE_API_BASE_URL);

// Test Items endpoint
async function testItems() {
  console.log('\n📦 Testing Items API...');
  try {
    const items = await itemsService.getAll();
    console.log('✅ GET /items:', items.length, 'items found');
    return true;
  } catch (error) {
    console.error('❌ GET /items failed:', error);
    return false;
  }
}

// Test Products endpoint
async function testProducts() {
  console.log('\n🍔 Testing Products API...');
  try {
    const products = await productsService.getAll();
    console.log('✅ GET /products:', products.length, 'products found');
    return true;
  } catch (error) {
    console.error('❌ GET /products failed:', error);
    return false;
  }
}

// Test Stock endpoint
async function testStock() {
  console.log('\n📊 Testing Stock API...');
  try {
    const stock = await stockService.getAll();
    console.log('✅ GET /stock:', stock.length, 'stock entries found');
    return true;
  } catch (error) {
    console.error('❌ GET /stock failed:', error);
    return false;
  }
}

// Test Orders endpoint
async function testOrders() {
  console.log('\n🛒 Testing Orders API...');
  try {
    const orders = await ordersService.getAll();
    console.log('✅ GET /orders:', orders.length, 'orders found');
    return true;
  } catch (error) {
    console.error('❌ GET /orders failed:', error);
    return false;
  }
}

// Run all tests
export async function runApiTests() {
  console.log('🚀 Starting API Integration Tests...\n');
  
  const results = {
    items: await testItems(),
    products: await testProducts(),
    stock: await testStock(),
    orders: await testOrders(),
  };
  
  console.log('\n📊 Test Results:');
  console.table(results);
  
  const allPassed = Object.values(results).every(r => r === true);
  
  if (allPassed) {
    console.log('\n✅ All API endpoints working!');
  } else {
    console.log('\n⚠️ Some endpoints failed. Check backend server and CORS settings.');
  }
  
  return results;
}

// Auto-run if in development
if (import.meta.env.DEV) {
  console.log('💡 Run "runApiTests()" to test API connectivity');
}
