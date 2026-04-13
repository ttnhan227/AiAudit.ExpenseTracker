import apiClient from "./apiClient";

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface TenantUser {
  id: string;
  email: string;
  role: "Admin" | "Manager" | "User";
  isActive: boolean;
  invitationPending: boolean;
}

export interface InviteTenantUserRequest {
  email: string;
  role: "Admin" | "Manager" | "User";
}

export interface InviteTenantUserResponse {
  userId: string;
  email: string;
  role: "Admin" | "Manager" | "User";
  expiresAt: string;
  inviteToken: string;
  inviteUrl: string;
}

export interface UpdateUserRoleRequest {
  role: "Admin" | "Manager" | "User";
}

export interface UpdateUserStatusRequest {
  isActive: boolean;
}

export const adminUserService = {
  getUsers: async (): Promise<ApiResponse<TenantUser[]>> => {
    try {
      const response = await apiClient.get("/admin/users");
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || "Failed to load users",
      };
    }
  },

  inviteUser: async (request: InviteTenantUserRequest): Promise<ApiResponse<InviteTenantUserResponse>> => {
    try {
      const response = await apiClient.post("/admin/users", request);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || "Failed to invite user",
      };
    }
  },

  updateUserRole: async (userId: string, request: UpdateUserRoleRequest): Promise<ApiResponse<TenantUser>> => {
    try {
      const response = await apiClient.put(`/admin/users/${userId}/role`, request);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || "Failed to update role",
      };
    }
  },

  updateUserStatus: async (userId: string, request: UpdateUserStatusRequest): Promise<ApiResponse<TenantUser>> => {
    try {
      const response = await apiClient.put(`/admin/users/${userId}/status`, request);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || "Failed to update status",
      };
    }
  },
};
