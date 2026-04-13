namespace Server.Dtos.Manager;

using Server.Dtos.Expenses;

public sealed record PendingExpenseResponse(Guid Id, string EmployeeEmail, decimal Amount, string Currency, string Merchant, string Category, string Status, DateTime Date, bool Flagged, string? FlagReason, string? Description, string[] ReceiptUrls, int ReviewPriority, int TriggeredRuleCount, RiskAssessmentResponse RiskAssessment, ReviewAssistantResponse ReviewAssistant);
public sealed record RejectionReasonInsightResponse(string Reason, int Count);
public sealed record CategoryFlagInsightResponse(string Category, int FlaggedCount, int ExpenseCount, decimal FlagRate);
public sealed record EmployeeFlagInsightResponse(string EmployeeEmail, int FlaggedCount, int ExpenseCount, decimal FlagRate);
public sealed record PolicyTriggerInsightResponse(string Trigger, int Count);
public sealed record ReviewTurnaroundInsightResponse(decimal AverageApprovalHours, decimal AverageDecisionHours);
public sealed record OperationalKpiInsightResponse(decimal SlaBreachRate, decimal EscalationRate, int TotalDecisions, int SlaBreachedDecisions, int EscalationCount);
public sealed record MonthlyHighRiskInsightResponse(string MonthLabel, int HighRiskCount, int ReviewedCount);
public sealed record MonthlyPolicyTriggerInsightResponse(string MonthLabel, int TriggeredCount);
public sealed record AuditInsightsResponse(int ApprovedCount, int RejectedCount, int FlaggedCount, int HighRiskCount, ReviewTurnaroundInsightResponse Turnaround, OperationalKpiInsightResponse OperationalKpis, RejectionReasonInsightResponse[] TopRejectionReasons, CategoryFlagInsightResponse[] HighestFlaggedCategories, EmployeeFlagInsightResponse[] HighestFlagRateEmployees, PolicyTriggerInsightResponse[] TopPolicyTriggers, MonthlyHighRiskInsightResponse[] MonthlyHighRiskTrend, MonthlyPolicyTriggerInsightResponse[] MonthlyPolicyTriggerTrend);
public sealed record ApproveExpenseResponse(Guid ExpenseId, string Status, DateTime Timestamp);
public sealed record RejectExpenseRequest(string Reason);
public sealed record AuditEntryResponse(Guid Id, string Action, string PerformedBy, DateTime Timestamp, string? Notes, string? OldValue, string? NewValue);
