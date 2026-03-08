import apiClient from "@/lib/api";
import type { Tenant, CreateTenantDto, UpdateTenantDto } from "@/types/api";

/**
 * Tenants Service
 * GET /tenants - list tenants (for admin context switch)
 * POST /tenants - create tenant (admin)
 * PATCH /tenants/{id} - update tenant (admin or manager for own tenant)
 */
export const tenantsService = {
  async getTenants(): Promise<Tenant[]> {
    const response = await apiClient.get<Tenant[]>("/tenants");
    return response.data;
  },

  async createTenant(data: CreateTenantDto): Promise<Tenant> {
    const response = await apiClient.post<Tenant>("/tenants", data);
    return response.data;
  },

  async updateTenant(id: string, data: UpdateTenantDto): Promise<Tenant> {
    const response = await apiClient.patch<Tenant>(`/tenants/${id}`, data);
    return response.data;
  },
};

export default tenantsService;
