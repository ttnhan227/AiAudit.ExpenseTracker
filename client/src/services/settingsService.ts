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

export interface AutoApprovalRules {
  enabled: boolean;
  maxAmount: number;
  maxRiskScore: number;
  excludeWeekends: boolean;
  excludedCategories: string[];
  minAgeHours: number;
}

export interface UpdateAutoApprovalRulesRequest {
  enabled: boolean;
  maxAmount: number;
  maxRiskScore: number;
  excludeWeekends: boolean;
  excludedCategories: string[];
  minAgeHours: number;
}

export interface NotificationSettings {
  emailNotificationsEnabled: boolean;
  slackNotificationsEnabled: boolean;
  slackWebhookUrl?: string;
  slackChannel?: string;
  slackTeamId?: string;
  slackUserEmailMappings?: string;
  managerEmail?: string;
  noReplyEmail?: string;
}

export interface UpdateNotificationSettingsRequest {
  emailNotificationsEnabled: boolean;
  slackNotificationsEnabled: boolean;
  slackWebhookUrl?: string;
  slackChannel?: string;
  slackTeamId?: string;
  slackUserEmailMappings?: string;
  managerEmail?: string;
  noReplyEmail?: string;
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

  getAutoApprovalRules: async (): Promise<ApiResponse<AutoApprovalRules>> => {
    try {
      const response = await apiClient.get("/settings/auto-approval-rules");
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || "Failed to fetch auto-approval rules",
      };
    }
  },

  updateAutoApprovalRules: async (request: UpdateAutoApprovalRulesRequest): Promise<ApiResponse<null>> => {
    try {
      const response = await apiClient.put("/settings/auto-approval-rules", request);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || "Failed to update auto-approval rules",
      };
    }
  },

  getNotificationSettings: async (): Promise<ApiResponse<NotificationSettings>> => {
    try {
      const response = await apiClient.get("/settings/notifications");
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || "Failed to fetch notification settings",
      };
    }
  },

  updateNotificationSettings: async (request: UpdateNotificationSettingsRequest): Promise<ApiResponse<null>> => {
    try {
      const response = await apiClient.put("/settings/notifications", request);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || "Failed to update notification settings",
      };
    }
  },
};
