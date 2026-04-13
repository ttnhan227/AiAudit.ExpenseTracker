import apiClient from "./apiClient";
import { ApiResponse } from "./authService";

export interface CompanySettings {
  tenantId: string;
  companyName: string;
  planType: string;
  maxSpendLimit: number;
  policyNotes?: string;
}

export interface UpdatePolicyRequest {
  maxSpendLimit: number;
  policyNotes?: string;
}

export const settingsService = {
  getCompanySettings: async (): Promise<ApiResponse<CompanySettings>> => {
    try {
      const response = await apiClient.get("/settings/company");
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || "Failed to fetch company settings",
      };
    }
  },

  updatePolicy: async (request: UpdatePolicyRequest): Promise<ApiResponse<null>> => {
    try {
      const response = await apiClient.put("/settings/policy", request);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || "Failed to update policy",
      };
    }
  },
};
