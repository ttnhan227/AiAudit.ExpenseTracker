using Server.Common;
using Server.Dtos.Subscription;

namespace Server.Services;

public interface ISubscriptionService
{
    Task<ApiResult<GetPlansResponse>> GetAvailablePlansAsync();
    Task<ApiResult<SubscriptionResponse>> SubscribeAsync(Guid tenantId, SubscribeRequest request);
    Task<ApiResult<CurrentSubscriptionResponse>> GetCurrentSubscriptionAsync(Guid tenantId);
    Task<ApiResult<BillingHistoryItemResponse[]>> GetBillingHistoryAsync(Guid tenantId);
    Task<ApiResult> CancelSubscriptionAsync(Guid tenantId);
    Task<ApiResult<SubscriptionResponse>> UpgradeSubscriptionAsync(Guid tenantId, UpgradeSubscriptionRequest request);
}
