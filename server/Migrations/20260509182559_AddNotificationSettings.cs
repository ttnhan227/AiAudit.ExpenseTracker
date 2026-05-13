using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace server.Migrations
{
    /// <inheritdoc />
    public partial class AddNotificationSettings : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "EmailNotificationsEnabled",
                table: "Tenants",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "ManagerEmail",
                table: "Tenants",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "NoReplyEmail",
                table: "Tenants",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SlackChannel",
                table: "Tenants",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "SlackNotificationsEnabled",
                table: "Tenants",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "SlackTeamId",
                table: "Tenants",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SlackVerificationToken",
                table: "Tenants",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SlackWebhookUrl",
                table: "Tenants",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "EmailNotificationsEnabled",
                table: "Tenants");

            migrationBuilder.DropColumn(
                name: "ManagerEmail",
                table: "Tenants");

            migrationBuilder.DropColumn(
                name: "NoReplyEmail",
                table: "Tenants");

            migrationBuilder.DropColumn(
                name: "SlackChannel",
                table: "Tenants");

            migrationBuilder.DropColumn(
                name: "SlackNotificationsEnabled",
                table: "Tenants");

            migrationBuilder.DropColumn(
                name: "SlackTeamId",
                table: "Tenants");

            migrationBuilder.DropColumn(
                name: "SlackVerificationToken",
                table: "Tenants");

            migrationBuilder.DropColumn(
                name: "SlackWebhookUrl",
                table: "Tenants");
        }
    }
}
