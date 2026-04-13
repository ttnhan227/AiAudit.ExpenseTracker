using Microsoft.AspNetCore.Mvc;
using Server.Common;
using Server.Dtos.Manager;

namespace Server.Services;

public interface IManagerService
{
    Task<ApiResult<IEnumerable<PendingExpenseResponse>>> GetPendingExpensesAsync(Guid tenantId);
    Task<ApiResult<AuditInsightsResponse>> GetAuditInsightsAsync(Guid tenantId);
    Task<ApiResult<ApproveExpenseResponse>> ApproveAsync(Guid id, Guid tenantId, string performedBy);
    Task<ApiResult> RejectAsync(Guid id, Guid tenantId, RejectExpenseRequest request, string performedBy);
    Task<ApiResult<IEnumerable<AuditEntryResponse>>> GetAuditTrailAsync(Guid id, Guid tenantId);
    Task<FileContentResult> ExportTenantExpensesAsync(Guid tenantId);
}
