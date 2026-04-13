import apiClient from "./apiClient";
import { ApiResponse } from "./authService";

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  monthlyPrice: number;
  annualPrice: number;
  expenseLimit: number;
  userSeats: number;
  advancedAnomalyDetection: boolean;
  unlimitedReceiptScanning: boolean;
  prioritySupport: boolean;
  customAuditReports: boolean;
  apiAccess: boolean;
  customAiModels: boolean;
  sso: boolean;
  dedicatedAccountManager: boolean;
  customIntegrations: boolean;
  onPremiseOption: boolean;
  slaGuarantee: boolean;
  features: string[];
}

export interface CurrentSubscription {
  planId: string;
  planName: string;
  price: number;
  billingCycle: "monthly" | "annual";
  startDate: string;
  renewalDate?: string;
  isActive: boolean;
  daysUntilRenewal: number;
  status: string;
}

export interface BillingHistoryItem {
  id: string;
  date: string;
  description: string;
  amount: number;
  status: string;
  planName: string;
  billingCycle: string;
}

export const subscriptionService = {
  getPlans: async (): Promise<ApiResponse<{ plans: SubscriptionPlan[] }>> => {
    try {
      const response = await apiClient.get("/subscriptions/plans");
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || "Failed to fetch subscription plans",
      };
    }
  },

  getCurrentSubscription: async (): Promise<ApiResponse<CurrentSubscription>> => {
    try {
      const response = await apiClient.get("/subscriptions/current");
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || "Failed to fetch current subscription",
      };
    }
  },

  subscribe: async (planId: string, billingCycle: "monthly" | "annual"): Promise<ApiResponse<any>> => {
    try {
      const response = await apiClient.post("/subscriptions/subscribe", {
        planId,
        billingCycle,
      });
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || "Failed to subscribe",
      };
    }
  },

  getBillingHistory: async (): Promise<ApiResponse<BillingHistoryItem[]>> => {
    try {
      const response = await apiClient.get("/subscriptions/billing-history");
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || "Failed to fetch billing history",
      };
    }
  },

  cancelSubscription: async (): Promise<ApiResponse<null>> => {
    try {
      const response = await apiClient.post("/subscriptions/cancel", {});
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || "Failed to cancel subscription",
      };
    }
  },

  upgradeSubscription: async (newPlanId: string): Promise<ApiResponse<any>> => {
    try {
      const response = await apiClient.post("/subscriptions/upgrade", {
        newPlanId,
      });
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || "Failed to upgrade subscription",
      };
    }
  },
};
