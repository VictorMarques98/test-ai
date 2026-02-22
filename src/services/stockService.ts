import apiClient from '@/lib/api';
import { Stock, CreateStockDto, UpdateStockDto } from '@/types/api';
import type { StockHistoryEntry } from '@/types/backend';

/**
 * Stock Service
 * Handles all API calls related to stock/inventory management
 */

export const stockService = {
  /**
   * Get all stock entries
   */
  async getAll(): Promise<Stock[]> {
    const response = await apiClient.get<Stock[]>('/stock');
    return response.data;
  },

  /**
   * Get stock by stock ID
   */
  async getById(id: string): Promise<Stock> {
    const response = await apiClient.get<Stock>(`/stock/${id}`);
    return response.data;
  },

  /**
   * Get stock by item ID
   */
  async getByItemId(itemId: string): Promise<Stock> {
    const response = await apiClient.get<Stock>(`/stock/item/${itemId}`);
    return response.data;
  },

  /**
   * Create stock for an item
   */
  async create(data: CreateStockDto): Promise<Stock> {
    const response = await apiClient.post<Stock>('/stock', data);
    return response.data;
  },

  /**
   * Update stock quantity (replaces current quantity)
   */
  async update(id: string, data: UpdateStockDto): Promise<Stock> {
    const response = await apiClient.patch<Stock>(`/stock/${id}`, data);
    return response.data;
  },

  /**
   * Get stock movement history
   */
  async getHistory(): Promise<StockHistoryEntry[]> {
    const response = await apiClient.get<StockHistoryEntry[]>('/stock/history');
    return response.data;
  },
};

export default stockService;
