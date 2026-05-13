using System.Text;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Server.Common;
using Server.Dtos.Manager;
using Server.Models;
using Server.Repositories;

namespace Server.Services;

public sealed class ManagerService : IManagerService
{
    private readonly IExpenseRepository _expenseRepository;
    private readonly IAuditLogRepository _auditLogRepository;
    private readonly IAuditLogService _auditLogService;
    private readonly ITenantRepository _tenantRepository;
    private readonly IRiskAssessmentService _riskAssessmentService;
    private readonly IReviewAssistantService _reviewAssistantService;
    private readonly INotificationService _notificationService;
    private readonly IUserRepository _userRepository;
    private readonly IBudgetGuardrailService _budgetGuardrailService;
    private readonly ILogger<ManagerService> _logger;

    public ManagerService(
        IExpenseRepository expenseRepository,
        IAuditLogRepository auditLogRepository,
        IAuditLogService auditLogService,
        ITenantRepository tenantRepository,
        IRiskAssessmentService riskAssessmentService,
        IReviewAssistantService reviewAssistantService,
        INotificationService notificationService,
        IUserRepository userRepository,
        IBudgetGuardrailService budgetGuardrailService,
        ILogger<ManagerService> logger)
    {
        _expenseRepository = expenseRepository;
        _auditLogRepository = auditLogRepository;
        _auditLogService = auditLogService;
        _tenantRepository = tenantRepository;
        _riskAssessmentService = riskAssessmentService;
        _reviewAssistantService = reviewAssistantService;
        _notificationService = notificationService;
        _userRepository = userRepository;
        _budgetGuardrailService = budgetGuardrailService;
        _logger = logger;
    }

    public async Task<ApiResult<IEnumerable<PendingExpenseResponse>>> GetPendingExpensesAsync(Guid tenantId)
    {
        var expenses = await _expenseRepository.GetPendingExpensesAsync(tenantId);
        var tenant = await _tenantRepository.GetByIdAsync(tenantId);
        if (tenant is null)
        {
            return ApiResult<IEnumerable<PendingExpenseResponse>>.Fail("Tenant context is missing.");
        }

        var tenantExpenses = await _expenseRepository.GetTenantExpensesAsync(tenantId);
        var assessments = _riskAssessmentService.EvaluateExpenses(expenses, tenant.MaxSpendLimit, tenantExpenses);
        var prioritized = expenses
            .OrderByDescending(expense => assessments[expense.Id].RiskScore)
            .ThenByDescending(expense => assessments[expense.Id].PolicyTriggers.Length)
            .ThenBy(expense => expense.Date)
            .ToList();

        var result = prioritized.Select((e, index) =>
        {
            var assessment = assessments[e.Id];
            return new PendingExpenseResponse(
                e.Id,
                e.User?.Email ?? "Unknown employee",
                e.Amount,
                e.Currency,
                e.Merchant,
                e.Category,
                e.Status,
                e.Date,
                e.Flagged,
                e.FlagReason,
                e.Description,
                e.Receipts.Select(r => r.FileUrl).ToArray(),
                index + 1,
                assessment.PolicyTriggers.Length,
                assessment.ToResponse(),
                _reviewAssistantService.BuildReview(e.Id, tenantExpenses, e, assessment));
        });

        return ApiResult<IEnumerable<PendingExpenseResponse>>.Ok(result);
    }

    public async Task<ApiResult<AuditInsightsResponse>> GetAuditInsightsAsync(Guid tenantId)
    {
        var tenant = await _tenantRepository.GetByIdAsync(tenantId);
        if (tenant is null)
        {
            return ApiResult<AuditInsightsResponse>.Fail("Tenant context is missing.");
        }

        var tenantExpenses = await _expenseRepository.GetTenantExpensesAsync(tenantId);
        var auditLogs = await _auditLogRepository.GetTenantAuditLogsAsync(tenantId);
        var assessments = _riskAssessmentService.EvaluateExpenses(tenantExpenses, tenant.MaxSpendLimit, tenantExpenses);

        var approvedCount = tenantExpenses.Count(expense => expense.Status.Equals(ExpenseStatuses.Approved, StringComparison.OrdinalIgnoreCase));
        var rejectedCount = tenantExpenses.Count(expense => expense.Status.Equals(ExpenseStatuses.Rejected, StringComparison.OrdinalIgnoreCase));
        var flaggedCount = tenantExpenses.Count(expense => expense.Flagged);
        var highRiskCount = assessments.Values.Count(assessment => assessment.RiskLevel == "High");

        var topRejectionReasons = auditLogs
            .Where(log => log.Action.Equals("Rejected", StringComparison.OrdinalIgnoreCase))
            .Select(log => ExtractReason(log.Notes))
            .Where(reason => !string.IsNullOrWhiteSpace(reason))
            .GroupBy(reason => reason!, StringComparer.OrdinalIgnoreCase)
            .Select(group => new RejectionReasonInsightResponse(group.Key, group.Count()))
            .OrderByDescending(group => group.Count)
            .Take(5)
            .ToArray();

        var highestFlaggedCategories = tenantExpenses
            .GroupBy(expense => expense.Category)
            .Select(group =>
            {
                var expenseCount = group.Count();
                var flaggedItems = group.Count(expense => expense.Flagged || assessments[expense.Id].RiskLevel == "High");
                var flagRate = expenseCount == 0 ? 0m : decimal.Round((decimal)flaggedItems / expenseCount * 100m, 2);
                return new CategoryFlagInsightResponse(group.Key, flaggedItems, expenseCount, flagRate);
            })
            .OrderByDescending(group => group.FlagRate)
            .ThenByDescending(group => group.FlaggedCount)
            .Take(5)
            .ToArray();

        var highestFlagRateEmployees = tenantExpenses
            .GroupBy(expense => expense.User?.Email ?? "Unknown employee")
            .Select(group =>
            {
                var expenseCount = group.Count();
                var flaggedItems = group.Count(expense => expense.Flagged || assessments[expense.Id].RiskLevel == "High");
                var flagRate = expenseCount == 0 ? 0m : decimal.Round((decimal)flaggedItems / expenseCount * 100m, 2);
                return new EmployeeFlagInsightResponse(group.Key, flaggedItems, expenseCount, flagRate);
            })
            .OrderByDescending(group => group.FlagRate)
            .ThenByDescending(group => group.FlaggedCount)
            .Take(5)
            .ToArray();

        var topPolicyTriggers = assessments.Values
            .SelectMany(assessment => assessment.PolicyTriggers)
            .Where(trigger => !string.IsNullOrWhiteSpace(trigger))
            .GroupBy(trigger => trigger, StringComparer.OrdinalIgnoreCase)
            .Select(group => new PolicyTriggerInsightResponse(group.Key, group.Count()))
            .OrderByDescending(group => group.Count)
            .Take(8)
            .ToArray();

        var turnaround = BuildTurnaroundInsights(auditLogs);
        var operationalKpis = BuildOperationalKpis(tenantExpenses, auditLogs, assessments);
        var monthlyHighRiskTrend = BuildMonthlyHighRiskTrend(tenantExpenses, assessments);
        var monthlyPolicyTriggerTrend = BuildMonthlyPolicyTriggerTrend(tenantExpenses, assessments);

        var response = new AuditInsightsResponse(
            approvedCount,
            rejectedCount,
            flaggedCount,
            highRiskCount,
            turnaround,
            operationalKpis,
            topRejectionReasons,
            highestFlaggedCategories,
            highestFlagRateEmployees,
            topPolicyTriggers,
            monthlyHighRiskTrend,
            monthlyPolicyTriggerTrend);

        return ApiResult<AuditInsightsResponse>.Ok(response);
    }

    public async Task<ApiResult<ApproveExpenseResponse>> ApproveAsync(Guid id, Guid tenantId, string performedBy)
    {
        var expense = await _expenseRepository.GetByIdAsync(id, tenantId);
        if (expense is null)
        {
            return ApiResult<ApproveExpenseResponse>.Fail("Expense not found.");
        }

        if (!IsPendingReviewStatus(expense.Status))
        {
            return ApiResult<ApproveExpenseResponse>.Fail("Only pending expenses may be approved.");
        }

        expense.Status = ExpenseStatuses.Approved;
        expense.UpdatedAt = DateTime.UtcNow;

        await _auditLogService.LogExpenseApprovedAsync(expense, performedBy);
        await _expenseRepository.SaveChangesAsync();

        return ApiResult<ApproveExpenseResponse>.Ok(new ApproveExpenseResponse(expense.Id, expense.Status, DateTime.UtcNow));
    }

    public async Task<ApiResult> RejectAsync(Guid id, Guid tenantId, RejectExpenseRequest request, string performedBy)
    {
        var expense = await _expenseRepository.GetByIdAsync(id, tenantId);
        if (expense is null)
        {
            return ApiResult.Fail("Expense not found.");
        }

        if (!IsPendingReviewStatus(expense.Status))
        {
            return ApiResult.Fail("Only pending expenses may be rejected.");
        }

        expense.Status = ExpenseStatuses.Rejected;
        expense.UpdatedAt = DateTime.UtcNow;

        await _auditLogService.LogExpenseRejectedAsync(expense, performedBy, request.Reason);
        await _expenseRepository.SaveChangesAsync();

        // Send rejection email notification asynchronously
        var approver = await _userRepository.GetByEmailAndTenantAsync(performedBy, tenantId);
        if (approver != null)
        {
            _ = Task.Run(async () =>
            {
                try
                {
                    await _notificationService.SendExpenseRejectedAsync(expense, request.Reason, approver);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to send rejection notification for expense {ExpenseId}", expense.Id);
                }
            });
        }

        return ApiResult.Ok();
    }

    public async Task<ApiResult<IEnumerable<AuditEntryResponse>>> GetAuditTrailAsync(Guid id, Guid tenantId)
    {
        var expense = await _expenseRepository.GetByIdAsync(id, tenantId);
        if (expense is null)
        {
            return ApiResult<IEnumerable<AuditEntryResponse>>.Fail("Expense not found.");
        }

        var auditEntries = await _auditLogRepository.GetByExpenseIdAsync(id);
        var result = auditEntries.Select(a => new AuditEntryResponse(a.Id, a.Action, a.PerformedBy, a.Timestamp, a.Notes, a.OldValue, a.NewValue));
        return ApiResult<IEnumerable<AuditEntryResponse>>.Ok(result);
    }

public async Task<FileContentResult> ExportTenantExpensesAsync(Guid tenantId)
     {
         var expenses = await _expenseRepository.GetTenantExpensesAsync(tenantId);
         var csv = new StringBuilder();
         csv.AppendLine("Id,EmployeeEmail,Amount,Currency,Merchant,Category,Status,Date,Flagged,FlagReason,Description,Receipts");

         foreach (var expense in expenses)
         {
             var receipts = string.Join("|", expense.Receipts.Select(r => r.FileUrl));
             csv.AppendLine($"{expense.Id},\"{EscapeValue(expense.User?.Email)}\",{expense.Amount},{expense.Currency},\"{EscapeValue(expense.Merchant)}\",\"{EscapeValue(expense.Category)}\",{expense.Status},{expense.Date:O},{expense.Flagged},\"{EscapeValue(expense.FlagReason)}\",\"{EscapeValue(expense.Description)}\",\"{EscapeValue(receipts)}\"");
         }

         var bytes = Encoding.UTF8.GetBytes(csv.ToString());
         return new FileContentResult(bytes, "text/csv") { FileDownloadName = $"tenant-expenses-{DateTime.UtcNow:yyyyMMdd}.csv" };
     }

     public async Task<FileContentResult> ExportToQuickBooksAsync(Guid tenantId)
     {
         var expenses = await _expenseRepository.GetTenantExpensesAsync(tenantId);
         var csv = new StringBuilder();

         // QuickBooks IIF format header
         csv.AppendLine("!TRNS\tTRNSTYPE\tDATE\tACCNT\tNAME\tAMOUNT\tMEMO");
         csv.AppendLine("!SPL\tSPLACCNT\tNAME\tAMOUNT");
         csv.AppendLine("!ENDTRNS");

         foreach (var expense in expenses)
         {
             var date = expense.Date.ToString("MM/dd/yyyy");
             var amount = expense.Amount.ToString("F2", System.Globalization.CultureInfo.InvariantCulture);

             // Main transaction row
             csv.AppendLine($"TRNS\tEXPENSE\t{date}\tExpenses:{expense.Category}\t{expense.Merchant}\t-{amount}\t{expense.Description ?? expense.Category}");

             // Split row (required by QuickBooks)
             var splitAccount = "Accounts Payable";
             csv.AppendLine($"SPL\t{splitAccount}\t{expense.User?.Email ?? "Unknown"}\t{amount}");

             csv.AppendLine("ENDTRNS");
         }

         var bytes = Encoding.UTF8.GetBytes(csv.ToString());
         return new FileContentResult(bytes, "text/csv")
         {
             FileDownloadName = $"quickbooks-export-{DateTime.UtcNow:yyyyMMdd}.iif"
         };
     }

     public async Task<FileContentResult> ExportToXeroAsync(Guid tenantId)
     {
         var expenses = await _expenseRepository.GetTenantExpensesAsync(tenantId);
         var csv = new StringBuilder();

         // Xero CSV format - simplified version of their standard format
         csv.AppendLine("Date,ContactName,ContactNumber,AccountCode,Description,Quantity,UnitAmount,Total,CurrencyCode,TaxType,TaxAmount,ExchangeRate");

          foreach (var expense in expenses)
          {
              var date = expense.Date.ToString("yyyy-MM-dd");
              var amount = expense.Amount.ToString("F2", System.Globalization.CultureInfo.InvariantCulture);
              var contactName = expense.User?.Email ?? "Unknown Employee";
              var accountCode = MapCategoryToAccountCode(expense.Category);
              var description = EscapeValue(expense.Description ?? expense.Merchant);

              csv.AppendLine($"{date},{EscapeValue(contactName)},,,{description},1,{amount},{amount},{expense.Currency ?? "USD"},NONE,0,1");
          }

         var bytes = Encoding.UTF8.GetBytes(csv.ToString());
         return new FileContentResult(bytes, "text/csv")
         {
             FileDownloadName = $"xero-export-{DateTime.UtcNow:yyyyMMdd}.csv"
         };
     }

      private static string MapCategoryToAccountCode(string category)
      {
          return category.ToLower() switch
          {
              "travel" => "6100",
              "meals" => "6200",
              "accommodation" => "6300",
              "office supplies" => "6400",
              "software" => "6500",
              "training" => "6600",
              _ => "6999" // Miscellaneous
          };
      }

    public async Task<ApiResult<BudgetPredictionResponse>> GetBudgetPredictionAsync(Guid tenantId)
    {
        var tenant = await _tenantRepository.GetByIdAsync(tenantId);
        if (tenant is null)
        {
            return ApiResult<BudgetPredictionResponse>.Fail("Tenant not found.");
        }

        var prediction = await _budgetGuardrailService.GetBudgetPredictionAsync(tenant);
        return prediction;
    }

    private static List<(DateTime Month, decimal Value)> GetLast6MonthsOfData(IEnumerable<Expense> expenses)
     {
         var now = DateTime.UtcNow;
         return Enumerable.Range(0, 6)
             .Select(offset => new DateTime(now.Year, now.Month, 1).AddMonths(-offset))
             .Select(month =>
             {
                 var start = new DateTime(month.Year, month.Month, 1);
                 var end = start.AddMonths(1).AddDays(-1);
                 var monthData = expenses.Where(e => e.Date >= start && e.Date <= end);
                 return (start, monthData.Sum(e => e.Amount));
             })
             .OrderBy(m => m.Item1)
             .ToList();
     }

    private static string EscapeValue(string? value)
    {
        return string.IsNullOrEmpty(value) ? string.Empty : value.Replace("\"", "\"\"");
    }

    private static bool IsPendingReviewStatus(string status)
    {
        return status.Equals(ExpenseStatuses.Pending, StringComparison.OrdinalIgnoreCase)
            || status.Equals("Submitted", StringComparison.OrdinalIgnoreCase);
    }

    private static string? ExtractReason(string? notes)
    {
        if (string.IsNullOrWhiteSpace(notes))
        {
            return null;
        }

        var segments = notes.Split("|", StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries);
        var reasonSegment = segments.FirstOrDefault(segment => segment.StartsWith("Reason:", StringComparison.OrdinalIgnoreCase));
        return reasonSegment?[(reasonSegment.IndexOf(':') + 1)..].Trim();
    }

    private static ReviewTurnaroundInsightResponse BuildTurnaroundInsights(IEnumerable<AuditLog> auditLogs)
    {
        var logList = auditLogs.ToList();
        var approvalHours = new List<decimal>();
        var decisionHours = new List<decimal>();

        foreach (var expenseLogGroup in logList.GroupBy(log => log.ExpenseId))
        {
            var submittedAt = expenseLogGroup
                .Where(log => log.Action.Equals("Submitted", StringComparison.OrdinalIgnoreCase))
                .OrderBy(log => log.Timestamp)
                .Select(log => (DateTime?)log.Timestamp)
                .FirstOrDefault();

            if (!submittedAt.HasValue)
            {
                continue;
            }

            var approvedAt = expenseLogGroup
                .Where(log => log.Action.Equals("Approved", StringComparison.OrdinalIgnoreCase))
                .OrderBy(log => log.Timestamp)
                .Select(log => (DateTime?)log.Timestamp)
                .FirstOrDefault();

            var decidedAt = expenseLogGroup
                .Where(log => log.Action.Equals("Approved", StringComparison.OrdinalIgnoreCase) || log.Action.Equals("Rejected", StringComparison.OrdinalIgnoreCase))
                .OrderBy(log => log.Timestamp)
                .Select(log => (DateTime?)log.Timestamp)
                .FirstOrDefault();

            if (approvedAt.HasValue)
            {
                approvalHours.Add(decimal.Round((decimal)(approvedAt.Value - submittedAt.Value).TotalHours, 2));
            }

            if (decidedAt.HasValue)
            {
                decisionHours.Add(decimal.Round((decimal)(decidedAt.Value - submittedAt.Value).TotalHours, 2));
            }
        }

        return new ReviewTurnaroundInsightResponse(
            approvalHours.Count > 0 ? decimal.Round(approvalHours.Average(), 2) : 0m,
            decisionHours.Count > 0 ? decimal.Round(decisionHours.Average(), 2) : 0m);
    }

    private static MonthlyHighRiskInsightResponse[] BuildMonthlyHighRiskTrend(IEnumerable<Expense> tenantExpenses, IReadOnlyDictionary<Guid, RiskEvaluationResult> assessments)
    {
        var expenseLookup = tenantExpenses.ToLookup(expense => new DateTime(expense.Date.Year, expense.Date.Month, 1));

        return Enumerable.Range(0, 6)
            .Select(offset => new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1).AddMonths(-5 + offset))
            .Select(month =>
            {
                var expensesInMonth = expenseLookup[month].ToList();
                var reviewedCount = expensesInMonth.Count(expense => expense.Status.Equals(ExpenseStatuses.Approved, StringComparison.OrdinalIgnoreCase) || expense.Status.Equals(ExpenseStatuses.Rejected, StringComparison.OrdinalIgnoreCase));
                var highRiskCount = expensesInMonth.Count(expense => assessments.TryGetValue(expense.Id, out var assessment) && assessment.RiskLevel == "High");
                return new MonthlyHighRiskInsightResponse(month.ToString("MMM yyyy"), highRiskCount, reviewedCount);
            })
            .ToArray();
    }

    private static MonthlyPolicyTriggerInsightResponse[] BuildMonthlyPolicyTriggerTrend(IEnumerable<Expense> tenantExpenses, IReadOnlyDictionary<Guid, RiskEvaluationResult> assessments)
    {
        var expenseLookup = tenantExpenses.ToLookup(expense => new DateTime(expense.Date.Year, expense.Date.Month, 1));

        return Enumerable.Range(0, 6)
            .Select(offset => new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1).AddMonths(-5 + offset))
            .Select(month =>
            {
                var expensesInMonth = expenseLookup[month];
                var triggeredCount = expensesInMonth
                    .Where(expense => assessments.TryGetValue(expense.Id, out _))
                    .Sum(expense => assessments[expense.Id].PolicyTriggers.Length);

                return new MonthlyPolicyTriggerInsightResponse(month.ToString("MMM yyyy"), triggeredCount);
            })
            .ToArray();
    }

    private OperationalKpiInsightResponse BuildOperationalKpis(IEnumerable<Expense> tenantExpenses, IEnumerable<AuditLog> auditLogs, IReadOnlyDictionary<Guid, RiskEvaluationResult> assessments)
    {
        const decimal slaHoursThreshold = 48m;
        var logsByExpense = auditLogs
            .GroupBy(log => log.ExpenseId)
            .ToDictionary(group => group.Key, group => group.OrderBy(log => log.Timestamp).ToList());

        var totalDecisions = 0;
        var slaBreachedDecisions = 0;

        foreach (var expense in tenantExpenses)
        {
            if (!logsByExpense.TryGetValue(expense.Id, out var logs))
            {
                continue;
            }

            var submittedAt = logs.FirstOrDefault(log => log.Action.Equals("Submitted", StringComparison.OrdinalIgnoreCase))?.Timestamp;
            var decidedAt = logs.FirstOrDefault(log => log.Action.Equals("Approved", StringComparison.OrdinalIgnoreCase) || log.Action.Equals("Rejected", StringComparison.OrdinalIgnoreCase))?.Timestamp;
            if (!submittedAt.HasValue || !decidedAt.HasValue)
            {
                continue;
            }

            totalDecisions++;
            var hoursToDecision = (decimal)(decidedAt.Value - submittedAt.Value).TotalHours;
            if (hoursToDecision > slaHoursThreshold)
            {
                slaBreachedDecisions++;
            }
        }

        var escalationCount = tenantExpenses.Count(expense =>
        {
            if (!assessments.TryGetValue(expense.Id, out var assessment))
            {
                return false;
            }

            var recommendation = _reviewAssistantService.BuildReview(expense.Id, tenantExpenses, expense, assessment).Recommendation;
            return recommendation.Equals("Escalate", StringComparison.OrdinalIgnoreCase);
        });

        var expenseCount = tenantExpenses.Count();
        var slaBreachRate = totalDecisions == 0 ? 0m : decimal.Round((decimal)slaBreachedDecisions / totalDecisions * 100m, 2);
        var escalationRate = expenseCount == 0 ? 0m : decimal.Round((decimal)escalationCount / expenseCount * 100m, 2);

        return new OperationalKpiInsightResponse(slaBreachRate, escalationRate, totalDecisions, slaBreachedDecisions, escalationCount);
    }

    private static decimal CalculateConfidence(List<(DateTime Month, decimal Value)> historicalMonths, decimal dailyAverage, decimal currentMonthTotal)
    {
        if (historicalMonths.Count == 0) return 30m;
        
        var avgDaily = (double)historicalMonths.Average(m => m.Value / 30m);
        var variance = historicalMonths.Count > 1 
            ? Math.Sqrt(historicalMonths.Sum(m => Math.Pow((double)((m.Value / 30m) - (decimal)avgDaily), 2)) / (historicalMonths.Count - 1)) 
            : 0;
        
        var stabilityFactor = Math.Exp(-(double)(variance / avgDaily));
        var currentDay = DateTime.UtcNow.Day;
        var progressFactor = Math.Min(1.0, (double)currentDay / 30.0);
        
        return Math.Min(95m, Math.Max(30m, decimal.Round(30 + (decimal)(stabilityFactor * 50 + progressFactor * 15), 1)));
    }
}
