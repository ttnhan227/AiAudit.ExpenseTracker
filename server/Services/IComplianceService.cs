using Server.Common;
using Server.Dtos.Compliance;

namespace Server.Services;

public interface IComplianceService
{
    Task<ApiResult<SoxAuditTrailResponse>> GetSoxAuditTrailAsync(Guid tenantId, DateTime? from, DateTime? to);
    Task<ApiResult<GdprUserDataExport>> ExportUserDataAsync(Guid userId, Guid tenantId);
    Task<ApiResult<GdprDeletionResponse>> DeleteUserDataAsync(Guid userId, Guid tenantId, string requestedBy);
    Task<ApiResult<Soc2ComplianceReport>> GetSoc2ReportAsync(Guid tenantId);
}
