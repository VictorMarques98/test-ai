import apiClient from '@/lib/api';
import { Order, CreateOrderDto, UpdateOrderStatusDto } from '@/types/api';

/**
 * Orders Service
 * Handles all API calls related to orders
 */

export const ordersService = {
  /**
   * Get all orders
   */
  async getAll(): Promise<Order[]> {
    const response = await apiClient.get<Order[]>('/orders');
    return response.data;
  },

  /**
   * Get order by ID
   */
  async getById(id: string): Promise<Order> {
    const response = await apiClient.get<Order>(`/orders/${id}`);
    return response.data;
  },

  /**
   * Create new order
   */
  async create(data: CreateOrderDto): Promise<Order> {
    const response = await apiClient.post<Order>('/orders', data);
    return response.data;
  },

  /**
   * Update order status
   * Valid transitions:
   * - from 'request' to 'in_progress' or 'refuse'
   * - from 'in_progress' to 'canceled' or 'finish'
   */
  async updateStatus(id: string, data: UpdateOrderStatusDto): Promise<Order> {
    const response = await apiClient.patch<Order>(`/orders/${id}/status`, data);
    return response.data;
  },
};

export default ordersService;
