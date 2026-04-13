import apiClient from "./apiClient";
import { ApiResponse } from "./authService";
import { Expense } from "./expenseService";

interface RiskAssessment {
  riskScore: number;
  riskLevel: string;
  riskReasons: string[];
  policyTriggers: string[];
}

interface ReviewAssistant {
  recommendation: string;
  confidence: string;
  summary: string;
  missingEvidence: string[];
  reviewerPrompts: string[];
  suspiciousPatterns: string[];
  relatedExpenses: Array<{
    id: string;
    employeeEmail: string;
    amount: number;
    currency: string;
    merchant: string;
    category: string;
    status: string;
    date: string;
    relationship: string;
  }>;
}

export interface PendingExpense {
  id: string;
  employeeEmail: string;
  amount: number;
  currency: string;
  merchant: string;
  category: string;
  status: string;
  date: string;
  flagged: boolean;
  flagReason?: string;
  description?: string;
  receiptUrls: string[];
  reviewPriority: number;
  triggeredRuleCount: number;
  riskAssessment: RiskAssessment;
  reviewAssistant: ReviewAssistant;
}

export interface AuditInsight {
  approvedCount: number;
  rejectedCount: number;
  flaggedCount: number;
  highRiskCount: number;
  turnaround: {
    averageApprovalHours: number;
    averageDecisionHours: number;
  };
  operationalKpis: {
    slaBreachRate: number;
    escalationRate: number;
    totalDecisions: number;
    slaBreachedDecisions: number;
    escalationCount: number;
  };
  topRejectionReasons: Array<{
    reason: string;
    count: number;
  }>;
  highestFlaggedCategories: Array<{
    category: string;
    flaggedCount: number;
    expenseCount: number;
    flagRate: number;
  }>;
  highestFlagRateEmployees: Array<{
    employeeEmail: string;
    flaggedCount: number;
    expenseCount: number;
    flagRate: number;
  }>;
  topPolicyTriggers: Array<{
    trigger: string;
    count: number;
  }>;
  monthlyHighRiskTrend: Array<{
    monthLabel: string;
    highRiskCount: number;
    reviewedCount: number;
  }>;
  monthlyPolicyTriggerTrend: Array<{
    monthLabel: string;
    triggeredCount: number;
  }>;
}

export interface AuditLog {
  id: string;
  action: string;
  performedBy: string;
  oldValue?: string;
  newValue?: string;
  timestamp: string;
  notes?: string;
}

export interface RejectRequest {
  reason: string;
}

export const managerService = {
  getPendingExpenses: async (): Promise<ApiResponse<PendingExpense[]>> => {
    try {
      const response = await apiClient.get("/manager/pending");
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || "Failed to fetch pending expenses",
      };
    }
  },

  getAuditInsights: async (): Promise<ApiResponse<AuditInsight>> => {
    try {
      const response = await apiClient.get("/manager/audit-insights");
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || "Failed to fetch audit insights",
      };
    }
  },

  approve: async (expenseId: string): Promise<ApiResponse<Expense>> => {
    try {
      const response = await apiClient.post(`/manager/approve/${expenseId}`);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || "Failed to approve expense",
      };
    }
  },

  reject: async (expenseId: string, request: RejectRequest): Promise<ApiResponse<Expense>> => {
    try {
      const response = await apiClient.post(`/manager/reject/${expenseId}`, request);
      return {
        success: response.data.success,
        data: undefined,
        error: response.data.error,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || "Failed to reject expense",
      };
    }
  },

  getAuditTrail: async (expenseId: string): Promise<ApiResponse<AuditLog[]>> => {
    try {
      const response = await apiClient.get(`/manager/audit-trail/${expenseId}`);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || "Failed to fetch audit trail",
      };
    }
  },

  exportExpenses: async (): Promise<Blob> => {
    try {
      const response = await apiClient.get("/manager/export", {
        responseType: "blob",
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || "Failed to export expenses");
    }
  },
};
