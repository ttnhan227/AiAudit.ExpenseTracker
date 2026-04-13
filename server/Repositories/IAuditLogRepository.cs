using Server.Models;

namespace Server.Repositories;

public interface IAuditLogRepository
{
    Task AddAsync(AuditLog auditLog);
    Task<List<AuditLog>> GetByExpenseIdAsync(Guid expenseId);
    Task<List<AuditLog>> GetTenantAuditLogsAsync(Guid tenantId);
    Task SaveChangesAsync();
}
