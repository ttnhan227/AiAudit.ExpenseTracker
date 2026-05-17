using Server.Common;
using Server.Dtos.Analytics;

namespace Server.Services;

public interface IAdvancedAnalyticsService
{
    Task<ApiResult<DepartmentBudgetPoolResponse>> GetDepartmentBudgetPoolAsync(Guid tenantId);
    Task<ApiResult<SeasonalAdjustmentResponse>> GetSeasonalAdjustmentsAsync(Guid tenantId);
    Task<ApiResult<CustomKpiDashboardResponse>> GetCustomKpiDashboardAsync(Guid tenantId);
}
