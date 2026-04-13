import apiClient from "./apiClient";
import { ApiResponse } from "./authService";

export interface RiskAssessment {
  riskScore: number;
  riskLevel: string;
  riskReasons: string[];
  policyTriggers: string[];
}

export interface ReviewAssistant {
  recommendation: string;
  confidence: string;
  summary: string;
  missingEvidence: string[];
  reviewerPrompts: string[];
  suspiciousPatterns: string[];
  relatedExpenses: any[];
}

export interface Expense {
  id: string;
  amount: number;
  currency: string;
  merchant: string;
  category: string;
  status: string;
  date: string;
  createdAt: string;
  updatedAt?: string;
  flagged: boolean;
  flagReason?: string;
  description?: string;
  receiptUrls: string[];
  riskAssessment: RiskAssessment;
  reviewAssistant: ReviewAssistant;
}

export interface ExpenseCreateRequest {
  amount: number;
  currency: string;
  merchant: string;
  category: string;
  date: string;
  description?: string;
}

export interface ExpenseUpdateRequest {
  amount: number;
  currency: string;
  merchant: string;
  category: string;
  date: string;
  description?: string;
}

export interface ExpenseStats {
  totalSpent: number;
  averageSpend: number;
  expenseCount: number;
  pendingCount: number;
  draftCount: number;
  highRiskCount: number;
  averageRiskScore: number;
  insights: {
    currentMonthTotal: number;
    previousMonthTotal: number;
    changeAmount: number;
    changePercentage: number;
    topCategories: Array<{
      category: string;
      totalSpent: number;
      expenseCount: number;
    }>;
  };
}

export const expenseService = {
  getAll: async (): Promise<ApiResponse<Expense[]>> => {
    try {
      const response = await apiClient.get("/expenses");
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || "Failed to fetch expenses",
      };
    }
  },

  getById: async (id: string): Promise<ApiResponse<Expense>> => {
    try {
      const response = await apiClient.get(`/expenses/${id}`);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || "Failed to fetch expense",
      };
    }
  },

  create: async (request: ExpenseCreateRequest): Promise<ApiResponse<Expense>> => {
    try {
      const response = await apiClient.post("/expenses", request);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || "Failed to create expense",
      };
    }
  },

  update: async (id: string, request: ExpenseUpdateRequest): Promise<ApiResponse<Expense>> => {
    try {
      const response = await apiClient.put(`/expenses/${id}`, request);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || "Failed to update expense",
      };
    }
  },

  submit: async (id: string): Promise<ApiResponse<Expense>> => {
    try {
      const response = await apiClient.post(`/expenses/${id}/submit`);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || "Failed to submit expense",
      };
    }
  },

  delete: async (id: string): Promise<ApiResponse<null>> => {
    try {
      const response = await apiClient.delete(`/expenses/${id}`);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || "Failed to delete expense",
      };
    }
  },

  getStats: async (): Promise<ApiResponse<ExpenseStats>> => {
    try {
      const response = await apiClient.get("/expenses/stats");
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || "Failed to fetch stats",
      };
    }
  },
};
