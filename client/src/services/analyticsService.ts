import apiClient from "./apiClient";
import { ApiResponse } from "./authService";

// ── Advanced Analytics ─────────────────────────────────────────────────────────

export interface DepartmentEmployeeSummary {
  email: string;
  totalSpend: number;
  expenseCount: number;
  sharePercent: number;
}

export interface DepartmentSpendSummary {
  department: string;
  budgetAllocated: number;
  totalSpend: number;
  remainingBudget: number;
  utilizationPercent: number;
  expenseCount: number;
  employees: DepartmentEmployeeSummary[];
}

export interface DepartmentBudgetPool {
  totalBudget: number;
  totalSpend: number;
  totalRemaining: number;
  overallUtilizationPercent: number;
  departments: DepartmentSpendSummary[];
  overBudgetDepartments: string[];
}

export interface MonthlySeasonalFactor {
  month: string;
  monthNumber: number;
  averageSpend: number;
  seasonalIndex: number;
  seasonalLabel: string;
}

export interface SeasonalAdjustment {
  annualAvgMonthlySpend: number;
  monthlyFactors: MonthlySeasonalFactor[];
  currentSeasonalLabel: string;
  currentMonthIndex: number;
  currentMonthBudgetSuggestion: number;
  insight: string;
}

export interface KpiMetric {
  name: string;
  value: string;
  unit?: string;
  trend?: string;
  trendValue?: number;
  category: string;
}

export interface CustomKpiDashboard {
  spendKpis: KpiMetric[];
  riskKpis: KpiMetric[];
  complianceKpis: KpiMetric[];
  efficiencyKpis: KpiMetric[];
  generatedAt: string;
}

// ── Compliance ─────────────────────────────────────────────────────────────────

export interface SoxAuditEntry {
  id: string;
  expenseId?: string;
  action: string;
  performedBy: string;
  ipAddress?: string;
  timestamp: string;
  oldValue?: string;
  newValue?: string;
  notes?: string;
  integrityHash: string;
}

export interface SoxAuditTrail {
  entries: SoxAuditEntry[];
  totalCount: number;
  exportedAt: string;
  exportHash: string;
}

export interface GdprExpenseRecord {
  id: string;
  amount: number;
  currency: string;
  merchant: string;
  category: string;
  description?: string;
  status: string;
  date: string;
  flagged: boolean;
  flagReason?: string;
}

export interface GdprUserDataExport {
  userId: string;
  email: string;
  role: string;
  isActive: boolean;
  preferredCurrency: string;
  cardSuspendedAt?: string;
  cardSuspensionReason?: string;
  expenses: GdprExpenseRecord[];
  auditActions: Array<{ id: string; action: string; timestamp: string; notes?: string }>;
  exportedAt: string;
}

export interface GdprDeletionResult {
  userId: string;
  email: string;
  success: boolean;
  message: string;
  expensesAnonymized: number;
  auditLogsRetained: number;
  processedAt: string;
}

export interface Soc2ControlCheck {
  controlId: string;
  description: string;
  passing: boolean;
  status: string;
  evidence: string;
  category: string;
}

export interface Soc2ComplianceReport {
  controls: Soc2ControlCheck[];
  passingCount: number;
  failingCount: number;
  warningCount: number;
  complianceScore: number;
  generatedAt: string;
  overallStatus: string;
}

// ── Service ────────────────────────────────────────────────────────────────────

export const analyticsService = {
  getDepartmentBudgetPool: async (): Promise<ApiResponse<DepartmentBudgetPool>> => {
    try {
      const response = await apiClient.get("/analytics/department-budget-pool");
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || "Failed to fetch department budget pool",
      };
    }
  },

  getSeasonalAdjustments: async (): Promise<ApiResponse<SeasonalAdjustment>> => {
    try {
      const response = await apiClient.get("/analytics/seasonal-adjustments");
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || "Failed to fetch seasonal adjustments",
      };
    }
  },

  getKpiDashboard: async (): Promise<ApiResponse<CustomKpiDashboard>> => {
    try {
      const response = await apiClient.get("/analytics/kpi-dashboard");
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || "Failed to fetch KPI dashboard",
      };
    }
  },
};

export const complianceService = {
  getSoxAuditTrail: async (from?: string, to?: string): Promise<ApiResponse<SoxAuditTrail>> => {
    try {
      const params: Record<string, string> = {};
      if (from) params.from = from;
      if (to) params.to = to;
      const response = await apiClient.get("/compliance/sox-audit-trail", { params });
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || "Failed to fetch SOX audit trail",
      };
    }
  },

  exportUserData: async (userId: string): Promise<ApiResponse<GdprUserDataExport>> => {
    try {
      const response = await apiClient.get(`/compliance/gdpr/export/${userId}`);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || "Failed to export user data",
      };
    }
  },

  deleteUserData: async (userId: string): Promise<ApiResponse<GdprDeletionResult>> => {
    try {
      const response = await apiClient.delete(`/compliance/gdpr/delete/${userId}`);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || "Failed to delete user data",
      };
    }
  },

  getSoc2Report: async (): Promise<ApiResponse<Soc2ComplianceReport>> => {
    try {
      const response = await apiClient.get("/compliance/soc2-report");
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || "Failed to fetch SOC2 report",
      };
    }
  },
};
