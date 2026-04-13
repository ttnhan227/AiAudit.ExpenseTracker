using Server.Common;
using Server.Dtos.Settings;

namespace Server.Services;

public interface ISettingsService
{
    Task<ApiResult<CompanySettingsResponse>> GetCompanySettingsAsync(Guid tenantId);
    Task<ApiResult> UpdatePolicyAsync(Guid tenantId, UpdatePolicyRequest request);
}
