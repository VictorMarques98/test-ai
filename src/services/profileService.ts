import apiClient from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { User, UpdateUserDto } from "@/types/api";

/**
 * Profile Service
 * Handles current user profile (GET /users/:id, PATCH /users/:id).
 * userId comes from auth store (set at login from response or decoded from JWT).
 */
export const profileService = {
  async getProfile(): Promise<User> {
    const userId = useAuthStore.getState().userId;
    if (!userId) {
      throw new Error("Usuário não identificado. Faça login novamente.");
    }
    const response = await apiClient.get<User>(`/users/${userId}`);
    return response.data;
  },

  /**
   * Update current user profile
   */
  async updateProfile(data: UpdateUserDto): Promise<User> {
    const userId = useAuthStore.getState().userId;
    if (!userId) {
      throw new Error("Usuário não identificado. Faça login novamente.");
    }
    const response = await apiClient.patch<User>(`/users/${userId}`, data);
    return response.data;
  },
};

export default profileService;
