using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace server.Migrations
{
    /// <inheritdoc />
    public partial class AddExpenseReviewFeedback : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ExpenseReviewFeedback",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ExpenseId = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    SubmittedBy = table.Column<string>(type: "text", nullable: false),
                    OriginalRiskScore = table.Column<int>(type: "integer", nullable: false),
                    OriginalRiskLevel = table.Column<string>(type: "character varying(25)", maxLength: 25, nullable: false),
                    CorrectedRiskLevel = table.Column<string>(type: "character varying(25)", maxLength: 25, nullable: false),
                    WasFalsePositive = table.Column<bool>(type: "boolean", nullable: false),
                    WasAutoApproved = table.Column<bool>(type: "boolean", nullable: false),
                    Notes = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ExpenseReviewFeedback", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ExpenseReviewFeedback_Expenses_ExpenseId",
                        column: x => x.ExpenseId,
                        principalTable: "Expenses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ExpenseReviewFeedback_ExpenseId",
                table: "ExpenseReviewFeedback",
                column: "ExpenseId");

            migrationBuilder.CreateIndex(
                name: "IX_ExpenseReviewFeedback_TenantId",
                table: "ExpenseReviewFeedback",
                column: "TenantId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ExpenseReviewFeedback");
        }
    }
}
