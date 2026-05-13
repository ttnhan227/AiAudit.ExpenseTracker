using System.Text.Json;
using Server.Common;
using Server.Dtos.Settings;
using Server.Repositories;

namespace Server.Services;

public sealed class SettingsService : ISettingsService
{
    private readonly ITenantRepository _tenantRepository;

    public SettingsService(ITenantRepository tenantRepository)
    {
        _tenantRepository = tenantRepository;
    }

    public async Task<ApiResult<CompanySettingsResponse>> GetCompanySettingsAsync(Guid tenantId)
    {
        var tenant = await _tenantRepository.GetByIdAsync(tenantId);
        if (tenant is null)
        {
            return ApiResult<CompanySettingsResponse>.Fail("Tenant not found.");
        }

        var response = new CompanySettingsResponse(tenant.Id, tenant.CompanyName, tenant.PlanType, tenant.MaxSpendLimit, tenant.PolicyNotes);
        return ApiResult<CompanySettingsResponse>.Ok(response);
    }

    public async Task<ApiResult> UpdatePolicyAsync(Guid tenantId, UpdatePolicyRequest request)
    {
        var tenant = await _tenantRepository.GetByIdAsync(tenantId);
        if (tenant is null)
        {
            return ApiResult.Fail("Tenant not found.");
        }

        tenant.MaxSpendLimit = request.MaxSpendLimit;
        tenant.PolicyNotes = request.PolicyNotes;
        await _tenantRepository.SaveChangesAsync();

        return ApiResult.Ok();
    }

    public async Task<ApiResult<AutoApprovalRulesResponse>> GetAutoApprovalRulesAsync(Guid tenantId)
    {
        var tenant = await _tenantRepository.GetByIdAsync(tenantId);
        if (tenant is null)
        {
            return ApiResult<AutoApprovalRulesResponse>.Fail("Tenant not found.");
        }

        var excludedCategories = string.IsNullOrWhiteSpace(tenant.AutoApprovalExcludedCategories)
            ? Array.Empty<string>()
            : JsonSerializer.Deserialize<string[]>(tenant.AutoApprovalExcludedCategories) ?? Array.Empty<string>();

        var response = new AutoApprovalRulesResponse(
            tenant.AutoApprovalEnabled,
            tenant.AutoApprovalMaxAmount,
            tenant.AutoApprovalMaxRiskScore,
            tenant.AutoApprovalExcludeWeekends,
            excludedCategories,
            tenant.AutoApprovalMinAgeHours
        );

        return ApiResult<AutoApprovalRulesResponse>.Ok(response);
    }

    public async Task<ApiResult> UpdateAutoApprovalRulesAsync(Guid tenantId, UpdateAutoApprovalRulesRequest request)
    {
        var tenant = await _tenantRepository.GetByIdAsync(tenantId);
        if (tenant is null)
        {
            return ApiResult.Fail("Tenant not found.");
        }

        tenant.AutoApprovalEnabled = request.Enabled;
        tenant.AutoApprovalMaxAmount = request.MaxAmount;
        tenant.AutoApprovalMaxRiskScore = request.MaxRiskScore;
        tenant.AutoApprovalExcludeWeekends = request.ExcludeWeekends;
        tenant.AutoApprovalExcludedCategories = JsonSerializer.Serialize(request.ExcludedCategories);
        tenant.AutoApprovalMinAgeHours = request.MinAgeHours;

        await _tenantRepository.SaveChangesAsync();
        return ApiResult.Ok();
    }

    public async Task<ApiResult<NotificationSettingsResponse>> GetNotificationSettingsAsync(Guid tenantId)
    {
        var tenant = await _tenantRepository.GetByIdAsync(tenantId);
        if (tenant is null)
        {
            return ApiResult<NotificationSettingsResponse>.Fail("Tenant not found.");
        }

var response = new NotificationSettingsResponse(
             tenant.EmailNotificationsEnabled,
             tenant.SlackNotificationsEnabled,
             // SECURITY: Sensitive fields (SlackWebhookUrl, SlackUserEmailMappings)
             // are excluded from API responses to prevent credential leakage.
             // Owners can still set them via the update endpoint.
             tenant.SlackChannel,
             tenant.SlackTeamId,
             tenant.ManagerEmail,
             tenant.NoReplyEmail
         );

        return ApiResult<NotificationSettingsResponse>.Ok(response);
    }

    public async Task<ApiResult> UpdateNotificationSettingsAsync(Guid tenantId, UpdateNotificationSettingsRequest request)
    {
        var tenant = await _tenantRepository.GetByIdAsync(tenantId);
        if (tenant is null)
        {
            return ApiResult.Fail("Tenant not found.");
        }

        tenant.EmailNotificationsEnabled = request.EmailNotificationsEnabled;
        tenant.SlackNotificationsEnabled = request.SlackNotificationsEnabled;
        tenant.SlackWebhookUrl = request.SlackWebhookUrl;
        tenant.SlackChannel = request.SlackChannel;
        tenant.SlackTeamId = request.SlackTeamId;
        tenant.SlackUserEmailMappings = request.SlackUserEmailMappings;
        tenant.ManagerEmail = request.ManagerEmail;
        tenant.NoReplyEmail = request.NoReplyEmail;

        await _tenantRepository.SaveChangesAsync();
        return ApiResult.Ok();
    }
}
