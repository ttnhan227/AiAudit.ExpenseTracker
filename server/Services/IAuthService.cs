using Server.Common;
using Server.Dtos.Auth;

namespace Server.Services;

public interface IAuthService
{
    Task<ApiResult<AuthResponse>> RegisterAsync(RegisterRequest request);
    Task<ApiResult<AuthResponse>> LoginAsync(LoginRequest request);
    Task<ApiResult<AuthResponse>> AcceptInviteAsync(AcceptInviteRequest request);
    Task<ApiResult<AuthResponse>> RefreshTokenAsync(RefreshTokenRequest request);
    Task<ApiResult<UserProfileResponse>> GetProfileAsync(Guid userId);
    Task<ApiResult> ChangePasswordAsync(Guid userId, ChangePasswordRequest request);
}
