using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Models;

namespace Server.Repositories;

public sealed class UserRepository : IUserRepository
{
    private readonly AppDbContext _context;

    public UserRepository(AppDbContext context)
    {
        _context = context;
    }

    public Task<User?> GetByEmailAsync(string email)
    {
        return _context.Users.Include(u => u.Tenant).FirstOrDefaultAsync(u => u.Email == email);
    }

    public Task<User?> GetByIdAsync(Guid id)
    {
        return _context.Users.Include(u => u.Tenant).FirstOrDefaultAsync(u => u.Id == id);
    }

    public Task<User?> GetByInviteTokenAsync(string inviteToken)
    {
        return _context.Users.Include(u => u.Tenant).FirstOrDefaultAsync(u => u.InviteToken == inviteToken);
    }

    public Task<User?> GetByIdAndTenantAsync(Guid id, Guid tenantId)
    {
        return _context.Users.FirstOrDefaultAsync(u => u.Id == id && u.TenantId == tenantId);
    }

    public Task<List<User>> GetByTenantIdAsync(Guid tenantId)
    {
        return _context.Users
            .Where(u => u.TenantId == tenantId)
            .OrderBy(u => u.Email)
            .ToListAsync();
    }

    public Task<int> CountByRoleAsync(Guid tenantId, string role)
    {
        return _context.Users.CountAsync(u => u.TenantId == tenantId && u.Role == role);
    }

    public Task<bool> EmailExistsAsync(string email)
    {
        return _context.Users.AnyAsync(u => u.Email == email);
    }

    public Task AddAsync(User user)
    {
        _context.Users.Add(user);
        return Task.CompletedTask;
    }

    public Task SaveChangesAsync()
    {
        return _context.SaveChangesAsync();
    }
}
