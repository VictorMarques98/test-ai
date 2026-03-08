import apiClient from '@/lib/api';
import { Order, CreateOrderDto, UpdateOrderDto, UpdateOrderStatusDto, PaginationParams, PaginatedResponse } from '@/types/api';

/**
 * Orders Service
 * Handles all API calls related to orders
 */

export const ordersService = {
  /**
   * Get all orders with pagination support
   * @param params - Optional pagination parameters (page, limit)
   */
  async getAll(params?: PaginationParams): Promise<PaginatedResponse<Order>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.set('page', params.page.toString());
    if (params?.limit) queryParams.set('limit', params.limit.toString());
    const url = queryParams.toString() ? `/orders?${queryParams}` : '/orders';
    const response = await apiClient.get<PaginatedResponse<Order>>(url);
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
   * Update order (only when status is in_progress)
   * Use productsAdd to add products, productsRemoved to remove products
   */
  async update(id: string, data: UpdateOrderDto): Promise<Order> {
    const response = await apiClient.patch<Order>(`/orders/${id}`, data);
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
