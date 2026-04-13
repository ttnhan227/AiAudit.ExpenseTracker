using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Server.Common;
using Server.Dtos.Subscription;
using Server.Services;

namespace Server.Controllers;

[ApiController]
[Route("api/subscriptions")]
public class SubscriptionsController : ControllerBase
{
    private readonly ISubscriptionService _subscriptionService;

    public SubscriptionsController(ISubscriptionService subscriptionService)
    {
        _subscriptionService = subscriptionService;
    }

    [AllowAnonymous]
    [HttpGet("plans")]
    public async Task<IActionResult> GetPlans()
    {
        var result = await _subscriptionService.GetAvailablePlansAsync();
        return Ok(result);
    }

    [Authorize(Roles = "Admin")]
    [HttpPost("subscribe")]
    public async Task<IActionResult> Subscribe(SubscribeRequest request)
    {
        var tenantId = User.GetTenantId();
        var result = await _subscriptionService.SubscribeAsync(tenantId, request);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [Authorize(Roles = "Admin,User")]
    [HttpGet("current")]
    public async Task<IActionResult> GetCurrentSubscription()
    {
        var tenantId = User.GetTenantId();
        var result = await _subscriptionService.GetCurrentSubscriptionAsync(tenantId);
        return result.Success ? Ok(result) : NotFound(result);
    }

    [Authorize(Roles = "Admin,User")]
    [HttpGet("billing-history")]
    public async Task<IActionResult> GetBillingHistory()
    {
        var tenantId = User.GetTenantId();
        var result = await _subscriptionService.GetBillingHistoryAsync(tenantId);
        return result.Success ? Ok(result) : NotFound(result);
    }

    [Authorize(Roles = "Admin")]
    [HttpPost("cancel")]
    public async Task<IActionResult> CancelSubscription()
    {
        var tenantId = User.GetTenantId();
        var result = await _subscriptionService.CancelSubscriptionAsync(tenantId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [Authorize(Roles = "Admin")]
    [HttpPost("upgrade")]
    public async Task<IActionResult> UpgradeSubscription(UpgradeSubscriptionRequest request)
    {
        var tenantId = User.GetTenantId();
        var result = await _subscriptionService.UpgradeSubscriptionAsync(tenantId, request);
        return result.Success ? Ok(result) : BadRequest(result);
    }
}
