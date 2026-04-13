namespace Server.Dtos.Admin;

public sealed record TenantUserResponse(Guid Id, string Email, string Role, bool IsActive, bool InvitationPending);
public sealed record InviteTenantUserRequest(string Email, string Role);
public sealed record InviteTenantUserResponse(Guid UserId, string Email, string Role, DateTime ExpiresAt, string InviteToken, string InviteUrl);
public sealed record UpdateUserRoleRequest(string Role);
public sealed record UpdateUserStatusRequest(bool IsActive);
