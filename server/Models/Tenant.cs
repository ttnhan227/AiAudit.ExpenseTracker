namespace Server.Models;

public class Tenant
{
    public Guid Id { get; set; }
    public string CompanyName { get; set; } = default!;
    public string ApiKey { get; set; } = default!;
    public string PlanType { get; set; } = default!;
    public decimal MaxSpendLimit { get; set; } = 2_000_000m;
    public string? PolicyNotes { get; set; }

    public ICollection<User> Users { get; set; } = new List<User>();
    public ICollection<Expense> Expenses { get; set; } = new List<Expense>();
    public ICollection<Subscription> Subscriptions { get; set; } = new List<Subscription>();
}
