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
}
