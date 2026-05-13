using Microsoft.EntityFrameworkCore.Storage;
using Server.Models;

namespace Server.Repositories;

public interface IUserRepository
{
    Task<User?> GetByEmailAsync(string email);
    Task<User?> GetByIdAsync(Guid id);
    Task<User?> GetByInviteTokenAsync(string inviteToken);
    Task<User?> GetByIdAndTenantAsync(Guid id, Guid tenantId);
    Task<User?> GetByEmailAndTenantAsync(string email, Guid tenantId);
    Task<List<User>> GetByTenantIdAsync(Guid tenantId);
    Task<int> CountByRoleAsync(Guid tenantId, string role);
    Task<bool> EmailExistsAsync(string email);
    Task AddAsync(User user);
    Task SaveChangesAsync();
    Task<IDbContextTransaction> BeginTransactionAsync();
    Task ExecuteSqlRawAsync(string sql, params object[] parameters);
}
