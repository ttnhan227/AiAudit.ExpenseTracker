using Server.Common;
using Server.Dtos.Expenses;
using Server.Models;
using Server.Repositories;

namespace Server.Services;

public sealed class ExpenseService : IExpenseService
{
    private readonly IExpenseRepository _expenseRepository;
    private readonly ITenantRepository _tenantRepository;
    private readonly IAuditLogService _auditLogService;
    private readonly IRiskAssessmentService _riskAssessmentService;
    private readonly IReviewAssistantService _reviewAssistantService;

    public ExpenseService(IExpenseRepository expenseRepository, ITenantRepository tenantRepository, IAuditLogService auditLogService, IRiskAssessmentService riskAssessmentService, IReviewAssistantService reviewAssistantService)
    {
        _expenseRepository = expenseRepository;
        _tenantRepository = tenantRepository;
        _auditLogService = auditLogService;
        _riskAssessmentService = riskAssessmentService;
        _reviewAssistantService = reviewAssistantService;
    }

    public async Task<ApiResult<IEnumerable<ExpenseResponse>>> GetMyExpensesAsync(Guid tenantId, string role, Guid userId)
    {
        var expenses = await _expenseRepository.GetExpensesAsync(tenantId, role, userId);
        var tenant = await _tenantRepository.GetByIdAsync(tenantId);
        if (tenant is null)
        {
            return ApiResult<IEnumerable<ExpenseResponse>>.Fail("Tenant context is missing.");
        }

        var tenantExpenses = await _expenseRepository.GetTenantExpensesAsync(tenantId);
        var visibleExpenses = HasTenantWideExpenseAccess(role)
            ? tenantExpenses
            : tenantExpenses.Where(expense => expense.UserId == userId).ToList();
        var assessments = _riskAssessmentService.EvaluateExpenses(expenses, tenant.MaxSpendLimit, tenantExpenses);
        return ApiResult<IEnumerable<ExpenseResponse>>.Ok(expenses.Select(expense => ToResponse(expense, assessments[expense.Id], visibleExpenses)));
    }

    public async Task<ApiResult<ExpenseResponse>> GetExpenseAsync(Guid id, Guid tenantId, string role, Guid userId)
    {
        var expense = await _expenseRepository.GetByIdAsync(id, tenantId);
        if (expense is null)
        {
            return ApiResult<ExpenseResponse>.Fail("Expense not found.");
        }

        if (!HasTenantWideExpenseAccess(role) && expense.UserId != userId)
        {
            return ApiResult<ExpenseResponse>.Fail("Forbidden");
        }

        var tenant = await _tenantRepository.GetByIdAsync(tenantId);
        if (tenant is null)
        {
            return ApiResult<ExpenseResponse>.Fail("Tenant context is missing.");
        }

        var tenantExpenses = await _expenseRepository.GetTenantExpensesAsync(tenantId);
        var visibleExpenses = HasTenantWideExpenseAccess(role)
            ? tenantExpenses
            : tenantExpenses.Where(candidate => candidate.UserId == userId).ToList();
        var assessment = _riskAssessmentService.EvaluateExpense(expense, tenant.MaxSpendLimit, tenantExpenses);

        return ApiResult<ExpenseResponse>.Ok(ToResponse(expense, assessment, visibleExpenses));
    }

    public async Task<ApiResult<ExpenseResponse>> CreateExpenseAsync(Guid tenantId, Guid userId, string performedBy, ExpenseCreateRequest request)
    {
        var tenant = await _tenantRepository.GetByIdAsync(tenantId);
        if (tenant is null)
        {
            return ApiResult<ExpenseResponse>.Fail("Tenant context is missing.");
        }

        var expense = new Expense
        {
            Id = Guid.NewGuid(),
            Amount = request.Amount,
            Currency = request.Currency,
            Merchant = request.Merchant,
            Category = request.Category,
            Description = request.Description,
            Status = ExpenseStatuses.Draft,
            Date = UtcDateTime.Normalize(request.Date),
            TenantId = tenantId,
            UserId = userId,
            CreatedAt = DateTime.UtcNow,
        };

        var tenantExpenses = await _expenseRepository.GetTenantExpensesAsync(tenantId);
        var assessment = _riskAssessmentService.EvaluateExpense(expense, tenant.MaxSpendLimit, [ ..tenantExpenses, expense ]);
        expense.Flagged = assessment.PolicyTriggers.Length > 0;
        expense.FlagReason = assessment.PolicyTriggers.Length > 0 ? string.Join(" ", assessment.PolicyTriggers) : null;

        await _expenseRepository.AddAsync(expense);
        await _auditLogService.LogExpenseCreatedAsync(expense, performedBy);
        await _expenseRepository.SaveChangesAsync();

        var visibleExpenses = tenantExpenses.Where(candidate => candidate.UserId == userId).Append(expense).ToList();
        return ApiResult<ExpenseResponse>.Ok(ToResponse(expense, assessment, visibleExpenses));
    }

    public async Task<ApiResult<ExpenseResponse>> UpdateExpenseAsync(Guid id, Guid tenantId, Guid userId, string performedBy, ExpenseUpdateRequest request)
    {
        var expense = await _expenseRepository.GetByIdAsync(id, tenantId);
        if (expense is null)
        {
            return ApiResult<ExpenseResponse>.Fail("Expense not found.");
        }

        if (expense.UserId != userId)
        {
            return ApiResult<ExpenseResponse>.Fail("Forbidden");
        }

        if (!expense.Status.Equals("Draft", StringComparison.OrdinalIgnoreCase))
        {
            return ApiResult<ExpenseResponse>.Fail("Only draft expenses may be updated.");
        }

        var before = CloneExpense(expense);

        expense.Amount = request.Amount;
        expense.Currency = request.Currency;
        expense.Merchant = request.Merchant;
        expense.Category = request.Category;
        expense.Date = UtcDateTime.Normalize(request.Date);
        expense.Description = request.Description;
        expense.UpdatedAt = DateTime.UtcNow;

        var tenant = await _tenantRepository.GetByIdAsync(tenantId);
        if (tenant is not null)
        {
            var tenantExpenses = await _expenseRepository.GetTenantExpensesAsync(tenantId);
            var assessment = _riskAssessmentService.EvaluateExpense(expense, tenant.MaxSpendLimit, tenantExpenses);
            expense.Flagged = assessment.PolicyTriggers.Length > 0;
            expense.FlagReason = assessment.PolicyTriggers.Length > 0 ? string.Join(" ", assessment.PolicyTriggers) : null;
            expense.Status = ExpenseStatuses.Draft;

            await _auditLogService.LogExpenseUpdatedAsync(before, expense, performedBy);
            await _expenseRepository.SaveChangesAsync();
            var visibleExpenses = tenantExpenses.Where(candidate => candidate.UserId == userId).Append(expense).ToList();
            return ApiResult<ExpenseResponse>.Ok(ToResponse(expense, assessment, visibleExpenses));
        }

        await _auditLogService.LogExpenseUpdatedAsync(before, expense, performedBy);
        await _expenseRepository.SaveChangesAsync();

        var fallbackAssessment = _riskAssessmentService.EvaluateExpense(expense, 0, [ expense ]);
        return ApiResult<ExpenseResponse>.Ok(ToResponse(expense, fallbackAssessment, [ expense ]));
    }

    public async Task<ApiResult<ExpenseResponse>> SubmitExpenseAsync(Guid id, Guid tenantId, Guid userId, string role, string performedBy)
    {
        var expense = await _expenseRepository.GetByIdAsync(id, tenantId);
        if (expense is null)
        {
            return ApiResult<ExpenseResponse>.Fail("Expense not found.");
        }

        if (!HasTenantWideExpenseAccess(role) && expense.UserId != userId)
        {
            return ApiResult<ExpenseResponse>.Fail("Forbidden");
        }

        if (!expense.Status.Equals(ExpenseStatuses.Draft, StringComparison.OrdinalIgnoreCase))
        {
            return ApiResult<ExpenseResponse>.Fail("Only draft expenses may be submitted.");
        }

        expense.Status = ExpenseStatuses.Pending;
        expense.UpdatedAt = DateTime.UtcNow;

        await _auditLogService.LogExpenseSubmittedAsync(expense, performedBy);
        await _expenseRepository.SaveChangesAsync();

        var tenant = await _tenantRepository.GetByIdAsync(tenantId);
        if (tenant is null)
        {
            return ApiResult<ExpenseResponse>.Fail("Tenant context is missing.");
        }

        var tenantExpenses = await _expenseRepository.GetTenantExpensesAsync(tenantId);
        var assessment = _riskAssessmentService.EvaluateExpense(expense, tenant.MaxSpendLimit, tenantExpenses);
        var visibleExpenses = HasTenantWideExpenseAccess(role)
            ? tenantExpenses
            : tenantExpenses.Where(candidate => candidate.UserId == userId).Append(expense).ToList();

        return ApiResult<ExpenseResponse>.Ok(ToResponse(expense, assessment, visibleExpenses));
    }

    public async Task<ApiResult> DeleteExpenseAsync(Guid id, Guid tenantId, Guid userId, string role, string performedBy)
    {
        var expense = await _expenseRepository.GetByIdAsync(id, tenantId);
        if (expense is null)
        {
            return ApiResult.Fail("Expense not found.");
        }

        if (expense.UserId != userId && !role.Equals("Admin", StringComparison.OrdinalIgnoreCase))
        {
            return ApiResult.Fail("Forbidden");
        }

        expense.IsDeleted = true;
        expense.UpdatedAt = DateTime.UtcNow;
        await _auditLogService.LogExpenseDeletedAsync(expense, performedBy);
        await _expenseRepository.SaveChangesAsync();

        return ApiResult.Ok();
    }

    public async Task<ApiResult<ExpenseStatsResponse>> GetExpenseStatsAsync(Guid tenantId, string role, Guid userId)
    {
        var expenses = await _expenseRepository.GetExpensesAsync(tenantId, role, userId);
        var tenant = await _tenantRepository.GetByIdAsync(tenantId);
        if (tenant is null)
        {
            return ApiResult<ExpenseStatsResponse>.Fail("Tenant context is missing.");
        }

        var tenantExpenses = await _expenseRepository.GetTenantExpensesAsync(tenantId);
        var assessments = _riskAssessmentService.EvaluateExpenses(expenses, tenant.MaxSpendLimit, tenantExpenses);
        var totalSpent = expenses.Sum(e => e.Amount);
        var averageSpend = expenses.Count > 0 ? expenses.Average(e => e.Amount) : 0m;
        var expenseCount = expenses.Count;
        var pendingCount = expenses.Count(e => IsPendingReviewStatus(e.Status));
        var draftCount = expenses.Count(e => e.Status == ExpenseStatuses.Draft);
        var highRiskCount = assessments.Values.Count(assessment => assessment.RiskLevel == "High");
        var averageRiskScore = assessments.Count > 0 ? decimal.Round((decimal)assessments.Values.Average(assessment => assessment.RiskScore), 2) : 0m;
        var insights = BuildInsights(expenses);

        return ApiResult<ExpenseStatsResponse>.Ok(new ExpenseStatsResponse(totalSpent, averageSpend, expenseCount, pendingCount, draftCount, highRiskCount, averageRiskScore, insights));
    }

    private ExpenseResponse ToResponse(Expense expense, RiskEvaluationResult assessment, IEnumerable<Expense> tenantExpenses)
    {
        var review = _reviewAssistantService.BuildReview(expense.Id, tenantExpenses, expense, assessment);
        return new ExpenseResponse(
            expense.Id,
            expense.Amount,
            expense.Currency,
            expense.Merchant,
            expense.Category,
            expense.Status,
            expense.Date,
            expense.CreatedAt,
            expense.UpdatedAt,
            expense.Flagged,
            expense.FlagReason,
            expense.Description,
            expense.Receipts.Select(r => r.FileUrl).ToArray(),
                assessment.ToResponse(),
                review);
    }

    private static Expense CloneExpense(Expense expense)
    {
        return new Expense
        {
            Id = expense.Id,
            Amount = expense.Amount,
            Currency = expense.Currency,
            Merchant = expense.Merchant,
            Category = expense.Category,
            Description = expense.Description,
            Status = expense.Status,
            Date = expense.Date,
            Flagged = expense.Flagged,
            FlagReason = expense.FlagReason,
            CreatedAt = expense.CreatedAt,
            UpdatedAt = expense.UpdatedAt,
            TenantId = expense.TenantId,
            UserId = expense.UserId,
        };
    }

    private static ExpenseInsightsResponse BuildInsights(IEnumerable<Expense> expenses)
    {
        var expenseList = expenses.ToList();
        var now = DateTime.UtcNow;
        var currentMonthStart = UtcDateTime.StartOfUtcMonth(now);
        var previousMonthStart = currentMonthStart.AddMonths(-1);

        var currentMonthExpenses = expenseList.Where(expense => expense.Date >= currentMonthStart).ToList();
        var previousMonthExpenses = expenseList.Where(expense => expense.Date >= previousMonthStart && expense.Date < currentMonthStart).ToList();
        var currentMonthTotal = currentMonthExpenses.Sum(expense => expense.Amount);
        var previousMonthTotal = previousMonthExpenses.Sum(expense => expense.Amount);
        var changeAmount = currentMonthTotal - previousMonthTotal;
        var changePercentage = previousMonthTotal == 0
            ? (currentMonthTotal > 0 ? 100m : 0m)
            : decimal.Round((changeAmount / previousMonthTotal) * 100m, 2);

        var topCategories = currentMonthExpenses
            .GroupBy(expense => expense.Category)
            .Select(group => new ExpenseCategoryBreakdownResponse(group.Key, group.Sum(expense => expense.Amount), group.Count()))
            .OrderByDescending(group => group.TotalSpent)
            .Take(4)
            .ToArray();

        return new ExpenseInsightsResponse(currentMonthTotal, previousMonthTotal, changeAmount, changePercentage, topCategories);
    }

    private static bool HasTenantWideExpenseAccess(string role)
    {
        return role.Equals("Admin", StringComparison.OrdinalIgnoreCase)
            || role.Equals("Manager", StringComparison.OrdinalIgnoreCase);
    }

    private static bool IsPendingReviewStatus(string status)
    {
        return status.Equals(ExpenseStatuses.Pending, StringComparison.OrdinalIgnoreCase)
            || status.Equals("Submitted", StringComparison.OrdinalIgnoreCase);
    }
}
