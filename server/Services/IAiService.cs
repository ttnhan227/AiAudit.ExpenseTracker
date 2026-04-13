using Microsoft.AspNetCore.Http;
using Server.Common;
using Server.Dtos.Ai;
using Server.Dtos.Expenses;

namespace Server.Services;

public interface IAiService
{
    Task<ApiResult<AiUploadResponse>> UploadReceiptAsync(IFormFile file, Guid tenantId);
    Task<ApiResult<ExpenseResponse>> ConfirmReceiptAsync(Guid tenantId, Guid userId, string performedBy, AiConfirmRequest request);
    Task<ApiResult<AiUsageResponse>> GetUsageAsync(Guid tenantId);
}
