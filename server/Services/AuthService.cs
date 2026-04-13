using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Server.Common;
using Server.Dtos.Auth;
using Server.Models;
using Server.Repositories;

namespace Server.Services;

public sealed class AuthService : IAuthService
{
    private readonly IUserRepository _userRepository;
    private readonly ITenantRepository _tenantRepository;
    private readonly IRefreshTokenRepository _refreshTokenRepository;
    private readonly TokenService _tokenService;
    private readonly JwtSettings _jwtSettings;

    public AuthService(
        IUserRepository userRepository,
        ITenantRepository tenantRepository,
        IRefreshTokenRepository refreshTokenRepository,
        TokenService tokenService,
        IOptions<JwtSettings> jwtSettings)
    {
        _userRepository = userRepository;
        _tenantRepository = tenantRepository;
        _refreshTokenRepository = refreshTokenRepository;
        _tokenService = tokenService;
        _jwtSettings = jwtSettings.Value;
    }

    public async Task<ApiResult<AuthResponse>> RegisterAsync(RegisterRequest request)
    {
        if (await _tenantRepository.CompanyExistsAsync(request.CompanyName))
        {
            return ApiResult<AuthResponse>.Fail("Company name already exists.");
        }

        if (await _userRepository.EmailExistsAsync(request.Email))
        {
            return ApiResult<AuthResponse>.Fail("Email already registered.");
        }

        var tenant = new Tenant
        {
            Id = Guid.NewGuid(),
            CompanyName = request.CompanyName,
            ApiKey = Guid.NewGuid().ToString("N"),
            PlanType = "Standard",
            MaxSpendLimit = 2_000_000m
        };

        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = request.Email,
            PasswordHash = PasswordHasher.Hash(request.Password),
            Role = "Admin",
            IsActive = true,
            InviteToken = null,
            InviteTokenExpiresAt = null,
            TenantId = tenant.Id,
            Tenant = tenant
        };

        await _tenantRepository.AddAsync(tenant);
        await _userRepository.AddAsync(user);
        await _tenantRepository.SaveChangesAsync();

        return await BuildAuthResponseAsync(user);
    }

    public async Task<ApiResult<AuthResponse>> LoginAsync(LoginRequest request)
    {
        var user = await _userRepository.GetByEmailAsync(request.Email);
        if (user is null || !PasswordHasher.Verify(user.PasswordHash, request.Password))
        {
            return ApiResult<AuthResponse>.Fail("Invalid email or password.");
        }

        if (!user.IsActive)
        {
            return ApiResult<AuthResponse>.Fail("Your account is inactive. Contact your Admin.");
        }

        return await BuildAuthResponseAsync(user);
    }

    public async Task<ApiResult<AuthResponse>> AcceptInviteAsync(AcceptInviteRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Token) || string.IsNullOrWhiteSpace(request.Password))
        {
            return ApiResult<AuthResponse>.Fail("Invite token and password are required.");
        }

        if (request.Password.Length < 8)
        {
            return ApiResult<AuthResponse>.Fail("Password must be at least 8 characters.");
        }

        var user = await _userRepository.GetByInviteTokenAsync(request.Token.Trim());
        if (user is null || !user.InviteTokenExpiresAt.HasValue || user.InviteTokenExpiresAt.Value < DateTime.UtcNow)
        {
            return ApiResult<AuthResponse>.Fail("Invite token is invalid or expired.");
        }

        user.PasswordHash = PasswordHasher.Hash(request.Password);
        user.IsActive = true;
        user.InviteToken = null;
        user.InviteTokenExpiresAt = null;
        await _userRepository.SaveChangesAsync();

        return await BuildAuthResponseAsync(user);
    }

    public async Task<ApiResult<AuthResponse>> RefreshTokenAsync(RefreshTokenRequest request)
    {
        var token = await _refreshTokenRepository.GetByTokenAsync(request.RefreshToken);
        if (token is null || token.Revoked || token.ExpiresAt <= DateTime.UtcNow || token.User is null || !token.User.IsActive)
        {
            return ApiResult<AuthResponse>.Fail("Refresh token is invalid or expired.");
        }

        token.Revoked = true;
        var newRefreshToken = _tokenService.CreateRefreshToken(token.UserId);
        await _refreshTokenRepository.AddAsync(newRefreshToken);
        await _refreshTokenRepository.SaveChangesAsync();

        var accessToken = _tokenService.CreateAccessToken(token.User);
        var profile = new UserProfileResponse(token.User.Id, token.User.Email, token.User.Role, token.User.TenantId, token.User.Tenant?.CompanyName ?? string.Empty, token.User.Tenant?.PlanType ?? string.Empty);
        var response = new AuthResponse(accessToken, newRefreshToken.Token, DateTime.UtcNow.AddMinutes(_jwtSettings.AccessTokenMinutes), profile);

        return ApiResult<AuthResponse>.Ok(response);
    }

    public async Task<ApiResult<UserProfileResponse>> GetProfileAsync(Guid userId)
    {
        var user = await _userRepository.GetByIdAsync(userId);
        if (user is null || !user.IsActive)
        {
            return ApiResult<UserProfileResponse>.Fail("User not found.");
        }

        var profile = new UserProfileResponse(user.Id, user.Email, user.Role, user.TenantId, user.Tenant?.CompanyName ?? string.Empty, user.Tenant?.PlanType ?? string.Empty);
        return ApiResult<UserProfileResponse>.Ok(profile);
    }

    public async Task<ApiResult> ChangePasswordAsync(Guid userId, ChangePasswordRequest request)
    {
        var user = await _userRepository.GetByIdAsync(userId);
        if (user is null || !user.IsActive)
        {
            return ApiResult.Fail("User not found.");
        }

        if (string.IsNullOrWhiteSpace(request.CurrentPassword) || string.IsNullOrWhiteSpace(request.NewPassword))
        {
            return ApiResult.Fail("Current and new password are required.");
        }

        if (!PasswordHasher.Verify(user.PasswordHash, request.CurrentPassword))
        {
            return ApiResult.Fail("Current password is incorrect.");
        }

        if (request.NewPassword.Length < 8)
        {
            return ApiResult.Fail("New password must be at least 8 characters.");
        }

        if (PasswordHasher.Verify(user.PasswordHash, request.NewPassword))
        {
            return ApiResult.Fail("New password must be different from the current password.");
        }

        user.PasswordHash = PasswordHasher.Hash(request.NewPassword);
        await _userRepository.SaveChangesAsync();

        return ApiResult.Ok();
    }

    private async Task<ApiResult<AuthResponse>> BuildAuthResponseAsync(User user)
    {
        var accessToken = _tokenService.CreateAccessToken(user);
        var refreshToken = _tokenService.CreateRefreshToken(user.Id);
        await _refreshTokenRepository.AddAsync(refreshToken);
        await _refreshTokenRepository.SaveChangesAsync();

        var profile = new UserProfileResponse(user.Id, user.Email, user.Role, user.TenantId, user.Tenant?.CompanyName ?? string.Empty, user.Tenant?.PlanType ?? string.Empty);
        var response = new AuthResponse(accessToken, refreshToken.Token, DateTime.UtcNow.AddMinutes(_jwtSettings.AccessTokenMinutes), profile);
        return ApiResult<AuthResponse>.Ok(response);
    }
}
