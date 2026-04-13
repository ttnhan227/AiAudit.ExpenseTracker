using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Server.Common;
using Server.Dtos.Auth;
using Server.Services;

namespace Server.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    [AllowAnonymous]
    [HttpPost("register")]
    public async Task<IActionResult> Register(RegisterRequest request)
    {
        var result = await _authService.RegisterAsync(request);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [AllowAnonymous]
    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginRequest request)
    {
        var result = await _authService.LoginAsync(request);
        return result.Success ? Ok(result) : Unauthorized(result);
    }

    [AllowAnonymous]
    [HttpPost("accept-invite")]
    public async Task<IActionResult> AcceptInvite(AcceptInviteRequest request)
    {
        var result = await _authService.AcceptInviteAsync(request);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [AllowAnonymous]
    [HttpPost("refresh")]
    [HttpPost("refresh-token")]
    public async Task<IActionResult> RefreshToken(RefreshTokenRequest request)
    {
        var result = await _authService.RefreshTokenAsync(request);
        return result.Success ? Ok(result) : Unauthorized(result);
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<IActionResult> Me()
    {
        var userId = User.GetUserId();
        var result = await _authService.GetProfileAsync(userId);
        return result.Success ? Ok(result) : NotFound(result);
    }

    [Authorize]
    [HttpPut("change-password")]
    public async Task<IActionResult> ChangePassword(ChangePasswordRequest request)
    {
        var userId = User.GetUserId();
        var result = await _authService.ChangePasswordAsync(userId, request);
        return result.Success ? Ok(result) : BadRequest(result);
    }
}
