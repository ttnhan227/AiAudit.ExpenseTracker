using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Logging;
using Server.Models;
using Server.Repositories;

namespace Server.Services;

public class SlackService : ISlackService
{
    private readonly ILogger<SlackService> _logger;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ITenantRepository _tenantRepository;

    public SlackService(
        ILogger<SlackService> logger,
        IHttpClientFactory httpClientFactory,
        ITenantRepository tenantRepository)
    {
        _logger = logger;
        _httpClientFactory = httpClientFactory;
        _tenantRepository = tenantRepository;
    }

    public async Task SendMessageAsync(string tenantId, string message, string? channel = null)
    {
        var tenant = await _tenantRepository.GetByIdAsync(Guid.Parse(tenantId));
        if (tenant == null)
        {
            _logger.LogWarning("Tenant not found for Slack notification: {TenantId}", tenantId);
            return;
        }

        if (!tenant.SlackNotificationsEnabled || string.IsNullOrWhiteSpace(tenant.SlackWebhookUrl))
        {
            _logger.LogDebug("Slack notifications disabled for tenant {TenantId}", tenantId);
            return;
        }

        try
        {
            var client = _httpClientFactory.CreateClient("Slack");
            var payload = new
            {
                text = message,
                channel = channel ?? tenant.SlackChannel ?? "#general",
                username = "AiAudit Bot",
                icon_emoji = ":robot_face:"
            };

            var response = await client.PostAsJsonAsync(tenant.SlackWebhookUrl, payload);
            response.EnsureSuccessStatusCode();
            _logger.LogInformation("Slack message sent to tenant {TenantId}", tenantId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send Slack message for tenant {TenantId}: {Message}", tenantId, ex.Message);
            throw;
        }
    }

    public async Task SendAnomalyAlertAsync(string tenantId, Expense expense, string anomalyType, string anomalyReason, User employee)
    {
        var message = $":warning: *Anomaly Detected*\n\n" +
                      $"*Expense:* {expense.Merchant} — ${expense.Amount}\n" +
                      $"*Employee:* {employee.Email}\n" +
                      $"*Date:* {expense.Date:yyyy-MM-dd}\n" +
                      $"*Category:* {expense.Category}\n" +
                      $"*Type:* {anomalyType}\n" +
                      $"*Reason:* {anomalyReason}\n" +
                      $"<https://app.aiaudit.app/expenses/{expense.Id}|Review in App>";

        await SendMessageAsync(tenantId, message);
    }

    public async Task SendDailyDigestAsync(string tenantId, int pendingCount, int highRiskCount, string managerUrl)
    {
        var message = $":calendar: *Daily Expense Digest*\n\n" +
                      $"*Pending review:* {pendingCount} expenses\n" +
                      $"*High-risk flagged:* {highRiskCount} expenses\n\n" +
                      $"<{managerUrl}|Open Manager Dashboard>";

        await SendMessageAsync(tenantId, message);
    }

    public async Task VerifyAndHandleSlashCommandAsync(HttpRequest request, string teamId, string userId, string command, string text, string responseUrl)
    {
        // Verify Slack request signature
        var signature = request.Headers["X-Slack-Signature"].FirstOrDefault();
        var timestamp = request.Headers["X-Slack-Request-Timestamp"].FirstOrDefault();
        var body = await new StreamReader(request.Body).ReadToEndAsync();

        // Get tenant by Slack teamId (requires storing teamId in tenant settings)
        var tenant = (await _tenantRepository.GetAllAsync())
            .FirstOrDefault(t => t.SlackTeamId == teamId);

        if (tenant == null || string.IsNullOrWhiteSpace(tenant.SlackVerificationToken))
        {
            _logger.LogWarning("Slash command from unregistered team: {TeamId}", teamId);
            await SendSlashResponse(responseUrl, "This workspace is not connected to AiAudit. Contact your Owner to enable Slack integration.");
            return;
        }

        // Verify signature (using verification token for now; in production use signing secret)
        var expectedSignature = "v0=" + ComputeHmacSha256(timestamp + ":" + body, tenant.SlackVerificationToken);
        if (!CryptographicOperations.FixedTimeEquals(
            Encoding.UTF8.GetBytes(expectedSignature),
            Encoding.UTF8.GetBytes(signature ?? "")))
        {
            _logger.LogWarning("Invalid Slack signature for team {TeamId}", teamId);
            await SendSlashResponse(responseUrl, "⚠️ Invalid request signature.");
            return;
        }

        var parts = text?.Split(' ', StringSplitOptions.RemoveEmptyEntries);
        if (parts == null || parts.Length == 0)
        {
            await SendSlashResponse(responseUrl, "Usage: `/expense approve <expense-id>`");
            return;
        }

        if (parts[0].Equals("approve", StringComparison.OrdinalIgnoreCase) && parts.Length > 1)
        {
            await SendSlashResponse(responseUrl, $"Processing approval for expense ID: {parts[1]}... (Feature coming in Phase 2.2)");
        }
        else
        {
            await SendSlashResponse(responseUrl, "Unknown command. Try `/expense approve <id>`");
        }
    }

    private async Task SendSlashResponse(string responseUrl, string message)
    {
        var client = _httpClientFactory.CreateClient("Slack");
        var payload = new { response_type = "ephemeral", text = message };
        await client.PostAsJsonAsync(responseUrl, payload);
    }

    private static string ComputeHmacSha256(string data, string key)
    {
        using var hmac = new System.Security.Cryptography.HMACSHA256(Encoding.UTF8.GetBytes(key));
        var hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(data));
        return string.Concat(hash.Select(b => b.ToString("x2")));
    }
}
