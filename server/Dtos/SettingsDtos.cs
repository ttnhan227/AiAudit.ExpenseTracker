namespace Server.Dtos.Settings;

public sealed record CompanySettingsResponse(Guid TenantId, string CompanyName, string PlanType, decimal MaxSpendLimit, string? PolicyNotes);
public sealed record UpdatePolicyRequest(decimal MaxSpendLimit, string? PolicyNotes);
