import apiClient from '@/lib/api';
import { Product, CreateProductDto, UpdateProductDto } from '@/types/api';

/**
 * Products Service
 * Handles all API calls related to products (dishes made from items)
 */

const normalizeProduct = (product: Product): Product => {
  const anyProduct = product as Product & { buy_price?: number | null };
  return {
    ...anyProduct,
    buyPrice: anyProduct.buyPrice ?? anyProduct.buy_price ?? undefined,
  };
};

export const productsService = {
  /**
   * Get all products
   */
  async getAll(): Promise<Product[]> {
    const response = await apiClient.get<Product[]>('/products');
    return response.data.map(normalizeProduct);
  },

  /**
   * Get product by ID
   */
  async getById(id: string): Promise<Product> {
    const response = await apiClient.get<Product>(`/products/${id}`);
    return normalizeProduct(response.data);
  },

  /**
   * Create new product
   */
  async create(data: CreateProductDto): Promise<Product> {
    const response = await apiClient.post<Product>('/products', data);
    return normalizeProduct(response.data);
  },

  /**
   * Update product
   */
  async update(id: string, data: UpdateProductDto): Promise<Product> {
    const response = await apiClient.patch<Product>(`/products/${id}`, data);
    return normalizeProduct(response.data);
  },

  /**
   * Delete product
   */
  async delete(id: string): Promise<void> {
    await apiClient.delete(`/products/${id}`);
  },
};

export default productsService;
