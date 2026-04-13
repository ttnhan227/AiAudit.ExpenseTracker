using Server.Models;

namespace Server.Repositories;

public interface ITenantRepository
{
    Task<Tenant?> GetByIdAsync(Guid tenantId);
    Task<bool> CompanyExistsAsync(string companyName);
    Task AddAsync(Tenant tenant);
    Task SaveChangesAsync();
}
