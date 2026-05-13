using Server.Models;

namespace Server.Services;

public interface INotificationService
{
    Task NotifyAnomalyDetectedAsync(Expense expense, string anomalyType, string anomalyReason, User employee);
    Task SendExpenseRejectedAsync(Expense expense, string rejectionReason, User approver);
    Task SendWeeklyDigestAsync(Guid tenantId);
    Task SendSlashCommandResponseAsync(string responseUrl, string message);
}
