namespace Server.Models;

public class User
{
    public Guid Id { get; set; }
    public string Email { get; set; } = default!;
    public string PasswordHash { get; set; } = string.Empty;
    public string Role { get; set; } = default!;
    public bool IsActive { get; set; } = true;
    public string? InviteToken { get; set; }
    public DateTime? InviteTokenExpiresAt { get; set; }

    public Guid TenantId { get; set; }
    public Tenant? Tenant { get; set; }

    public ICollection<Expense> Expenses { get; set; } = new List<Expense>();
}
