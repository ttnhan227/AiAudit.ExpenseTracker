using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Models;

namespace Server.Repositories;

public sealed class TenantRepository : ITenantRepository
{
    private readonly AppDbContext _context;

    public TenantRepository(AppDbContext context)
    {
        _context = context;
    }

    public Task<Tenant?> GetByIdAsync(Guid tenantId)
    {
        return _context.Tenants.FirstOrDefaultAsync(t => t.Id == tenantId);
    }

    public Task<bool> CompanyExistsAsync(string companyName)
    {
        return _context.Tenants.AnyAsync(t => t.CompanyName == companyName);
    }

    public Task AddAsync(Tenant tenant)
    {
        _context.Tenants.Add(tenant);
        return Task.CompletedTask;
    }

    public Task SaveChangesAsync()
    {
        return _context.SaveChangesAsync();
    }
}
