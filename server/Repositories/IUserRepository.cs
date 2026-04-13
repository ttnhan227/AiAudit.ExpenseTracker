using Server.Models;

namespace Server.Repositories;

public interface IUserRepository
{
    Task<User?> GetByEmailAsync(string email);
    Task<User?> GetByIdAsync(Guid id);
    Task<User?> GetByInviteTokenAsync(string inviteToken);
    Task<User?> GetByIdAndTenantAsync(Guid id, Guid tenantId);
    Task<List<User>> GetByTenantIdAsync(Guid tenantId);
    Task<int> CountByRoleAsync(Guid tenantId, string role);
    Task<bool> EmailExistsAsync(string email);
    Task AddAsync(User user);
    Task SaveChangesAsync();
}
