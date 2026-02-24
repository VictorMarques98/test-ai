import apiClient from "@/lib/api";
import type { Tenant } from "@/types/api";

/**
 * Tenants Service
 * GET /tenants - list tenants (for admin context switch)
 */
export const tenantsService = {
  async getTenants(): Promise<Tenant[]> {
    const response = await apiClient.get<Tenant[]>("/tenants");
    return response.data;
  },
};

export default tenantsService;
