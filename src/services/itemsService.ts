import apiClient from '@/lib/api';
import { Item, CreateItemDto, UpdateItemDto } from '@/types/api';

/**
 * Items Service
 * Handles all API calls related to items (ingredients/raw materials)
 */

export const itemsService = {
  /**
   * Get all items
   */
  async getAll(): Promise<Item[]> {
    const response = await apiClient.get<Item[]>('/items');
    return response.data;
  },

  /**
   * Get item by ID
   */
  async getById(id: string): Promise<Item> {
    const response = await apiClient.get<Item>(`/items/${id}`);
    return response.data;
  },

  /**
   * Create new item
   */
  async create(data: CreateItemDto): Promise<Item> {
    const response = await apiClient.post<Item>('/items', data);
    return response.data;
  },

  /**
   * Update item
   */
  async update(id: string, data: UpdateItemDto): Promise<Item> {
    const response = await apiClient.patch<Item>(`/items/${id}`, data);
    return response.data;
  },

  /**
   * Delete item
   */
  async delete(id: string): Promise<void> {
    await apiClient.delete(`/items/${id}`);
  },
};

export default itemsService;
