import apiClient from '@/lib/api';
import { Product, CreateProductDto, UpdateProductDto } from '@/types/api';

/**
 * Products Service
 * Handles all API calls related to products (dishes made from items)
 */

export const productsService = {
  /**
   * Get all products
   */
  async getAll(): Promise<Product[]> {
    const response = await apiClient.get<Product[]>('/products');
    return response.data;
  },

  /**
   * Get product by ID
   */
  async getById(id: string): Promise<Product> {
    const response = await apiClient.get<Product>(`/products/${id}`);
    return response.data;
  },

  /**
   * Create new product
   */
  async create(data: CreateProductDto): Promise<Product> {
    const response = await apiClient.post<Product>('/products', data);
    return response.data;
  },

  /**
   * Update product
   */
  async update(id: string, data: UpdateProductDto): Promise<Product> {
    const response = await apiClient.patch<Product>(`/products/${id}`, data);
    return response.data;
  },

  /**
   * Delete product
   */
  async delete(id: string): Promise<void> {
    await apiClient.delete(`/products/${id}`);
  },
};

export default productsService;
