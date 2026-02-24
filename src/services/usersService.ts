import apiClient from "@/lib/api";
import type { User, UpdateUserDto, RegisterDto } from "@/types/api";

/**
 * Users Service (admin / management)
 * GET /tenants/:tenantId/users - list users by tenant
 * POST /auth/register - create user (admin)
 * PATCH /users/:id - update user (admin), e.g. status 'active' | 'inactive'
 */
export const usersService = {
  async getUsersByTenant(tenantId: string): Promise<User[]> {
    const response = await apiClient.get<User[]>(`/tenants/${tenantId}/users`);
    return response.data;
  },

  async createUser(data: RegisterDto): Promise<User> {
    const response = await apiClient.post<User>("/auth/register", data);
    return response.data;
  },

  async updateUser(userId: string, data: UpdateUserDto): Promise<User> {
    const response = await apiClient.patch<User>(`/users/${userId}`, data);
    return response.data;
  },
};

export default usersService;
