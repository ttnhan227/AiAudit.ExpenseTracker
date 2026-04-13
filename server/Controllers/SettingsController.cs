using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Server.Common;
using Server.Dtos.Settings;
using Server.Services;

namespace Server.Controllers;

[ApiController]
[Authorize]
[Route("api/settings")]
public class SettingsController : ControllerBase
{
    private readonly ISettingsService _settingsService;

    public SettingsController(ISettingsService settingsService)
    {
        _settingsService = settingsService;
    }

    [HttpGet("company")]
    public async Task<IActionResult> GetCompanySettings()
    {
        var tenantId = User.GetTenantId();
        var result = await _settingsService.GetCompanySettingsAsync(tenantId);
        return result.Success ? Ok(result) : NotFound(result);
    }

    [Authorize(Roles = "Admin")]
    [HttpPut("policy")]
    public async Task<IActionResult> UpdatePolicy(UpdatePolicyRequest request)
    {
        var tenantId = User.GetTenantId();
        var result = await _settingsService.UpdatePolicyAsync(tenantId, request);
        return result.Success ? Ok(result) : NotFound(result);
    }
}
