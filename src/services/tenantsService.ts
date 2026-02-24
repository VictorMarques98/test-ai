import apiClient from "@/lib/api";
import type { Tenant, CreateTenantDto } from "@/types/api";

/**
 * Tenants Service
 * GET /tenants - list tenants (for admin context switch)
 * POST /tenants - create tenant (admin)
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
};

export default tenantsService;
