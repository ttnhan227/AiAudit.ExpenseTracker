using Server.Common;
using Server.Dtos.Admin;

namespace Server.Services;

public interface IAdminUserService
{
    Task<ApiResult<IEnumerable<TenantUserResponse>>> GetTenantUsersAsync(Guid tenantId);
    Task<ApiResult<InviteTenantUserResponse>> InviteTenantUserAsync(Guid tenantId, InviteTenantUserRequest request);
    Task<ApiResult<TenantUserResponse>> UpdateUserRoleAsync(Guid tenantId, Guid targetUserId, Guid actorUserId, UpdateUserRoleRequest request);
    Task<ApiResult<TenantUserResponse>> UpdateUserStatusAsync(Guid tenantId, Guid targetUserId, Guid actorUserId, UpdateUserStatusRequest request);
}
