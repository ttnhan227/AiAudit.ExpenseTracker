using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace server.Migrations
{
    /// <inheritdoc />
    public partial class AddAutoApprovalFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "AutoApprovalEnabled",
                table: "Tenants",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "AutoApprovalExcludeWeekends",
                table: "Tenants",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "AutoApprovalExcludedCategories",
                table: "Tenants",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "AutoApprovalMaxAmount",
                table: "Tenants",
                type: "numeric",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<int>(
                name: "AutoApprovalMaxRiskScore",
                table: "Tenants",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "AutoApprovalMinAgeHours",
                table: "Tenants",
                type: "integer",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AutoApprovalEnabled",
                table: "Tenants");

            migrationBuilder.DropColumn(
                name: "AutoApprovalExcludeWeekends",
                table: "Tenants");

            migrationBuilder.DropColumn(
                name: "AutoApprovalExcludedCategories",
                table: "Tenants");

            migrationBuilder.DropColumn(
                name: "AutoApprovalMaxAmount",
                table: "Tenants");

            migrationBuilder.DropColumn(
                name: "AutoApprovalMaxRiskScore",
                table: "Tenants");

            migrationBuilder.DropColumn(
                name: "AutoApprovalMinAgeHours",
                table: "Tenants");
        }
    }
}
