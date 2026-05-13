using Microsoft.Extensions.Logging;
using Server.Models;
using Server.Repositories;

namespace Server.Services;

public class WeeklyDigestBackgroundService : BackgroundService
{
    private readonly ILogger<WeeklyDigestBackgroundService> _logger;
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly TimeSpan _checkInterval = TimeSpan.FromHours(24); // Daily check

    public WeeklyDigestBackgroundService(
        ILogger<WeeklyDigestBackgroundService> logger,
        IServiceScopeFactory scopeFactory)
    {
        _logger = logger;
        _scopeFactory = scopeFactory;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Weekly Digest Background Service is starting.");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                // Run daily check
                await Task.Delay(_checkInterval, stoppingToken);

                using var scope = _scopeFactory.CreateScope();
                var tenantRepository = scope.ServiceProvider.GetRequiredService<ITenantRepository>();
                var notificationService = scope.ServiceProvider.GetRequiredService<INotificationService>();

                var tenants = await tenantRepository.GetAllAsync();
                var utcNow = DateTime.UtcNow;

                // Send digest on Mondays (or any day, simplified to every day for demo)
                foreach (var tenant in tenants)
                {
                    if (string.IsNullOrWhiteSpace(tenant.ManagerEmail))
                    {
                        continue; // Skip tenants without manager email
                    }

                    try
                    {
                        await notificationService.SendWeeklyDigestAsync(tenant.Id);
                        _logger.LogInformation("Weekly digest sent for tenant {TenantId} ({CompanyName})", tenant.Id, tenant.CompanyName);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Failed to send weekly digest for tenant {TenantId}", tenant.Id);
                    }
                }
            }
            catch (OperationCanceledException)
            {
                // Service is stopping
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unhandled error in WeeklyDigestBackgroundService. Will retry after interval.");
                await Task.Delay(TimeSpan.FromMinutes(5), stoppingToken); // Backoff on error
            }
        }

        _logger.LogInformation("Weekly Digest Background Service is stopping.");
    }
}
