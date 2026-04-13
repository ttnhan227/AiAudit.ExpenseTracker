using Server.Models;

namespace Server.Repositories;

public interface ISubscriptionRepository
{
    Task<Subscription?> GetByTenantIdAsync(Guid tenantId);
    Task<Subscription?> GetByIdAsync(Guid subscriptionId);
    Task AddAsync(Subscription subscription);
    Task UpdateAsync(Subscription subscription);
    Task SaveChangesAsync();
}
