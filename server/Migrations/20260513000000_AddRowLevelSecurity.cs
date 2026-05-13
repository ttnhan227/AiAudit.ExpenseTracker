using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace server.Migrations
{
    /// <inheritdoc />
    public partial class AddRowLevelSecurity : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                -- ============================================================
                -- Row Level Security for AiAudit.ExpenseTracker
                -- ============================================================
                -- Every table uses a session variable 'app.current_tenant_id'
                -- set by the application middleware after JWT authentication.
                --
                -- PERMISSIVE policies allow INSERT/UPDATE when the session
                -- context matches, while SELECT is always filtered.
                -- Registration endpoints bypass RLS via a dedicated
                -- database role or by temporarily disabling RLS.
                -- ============================================================

                -- Tenants: each tenant can only see their own row
                ALTER TABLE ""Tenants"" ENABLE ROW LEVEL SECURITY;
                CREATE POLICY tenant_isolation_select ON ""Tenants""
                    AS PERMISSIVE
                    FOR ALL
                    USING (""Id"" = current_setting('app.current_tenant_id', true)::uuid);

                -- Users: can only access users within own tenant
                ALTER TABLE ""Users"" ENABLE ROW LEVEL SECURITY;
                CREATE POLICY user_tenant_isolation ON ""Users""
                    AS PERMISSIVE
                    FOR ALL
                    USING (""TenantId"" = current_setting('app.current_tenant_id', true)::uuid);

                -- Expenses: tenant-scoped
                ALTER TABLE ""Expenses"" ENABLE ROW LEVEL SECURITY;
                CREATE POLICY expense_tenant_isolation ON ""Expenses""
                    AS PERMISSIVE
                    FOR ALL
                    USING (""TenantId"" = current_setting('app.current_tenant_id', true)::uuid);

                -- Receipts: scoped through Expense -> Tenant
                ALTER TABLE ""Receipts"" ENABLE ROW LEVEL SECURITY;
                CREATE POLICY receipt_tenant_isolation ON ""Receipts""
                    AS PERMISSIVE
                    FOR ALL
                    USING (""ExpenseId"" IN (
                        SELECT ""Id"" FROM ""Expenses""
                        WHERE ""TenantId"" = current_setting('app.current_tenant_id', true)::uuid
                    ));

                -- AuditLogs: scoped through Expense -> Tenant
                ALTER TABLE ""AuditLogs"" ENABLE ROW LEVEL SECURITY;
                CREATE POLICY auditlog_tenant_isolation ON ""AuditLogs""
                    AS PERMISSIVE
                    FOR ALL
                    USING (""ExpenseId"" IN (
                        SELECT ""Id"" FROM ""Expenses""
                        WHERE ""TenantId"" = current_setting('app.current_tenant_id', true)::uuid
                    ));

                -- RefreshTokens: scoped through User -> Tenant
                ALTER TABLE ""RefreshTokens"" ENABLE ROW LEVEL SECURITY;
                CREATE POLICY refreshtoken_user_isolation ON ""RefreshTokens""
                    AS PERMISSIVE
                    FOR ALL
                    USING (""UserId"" IN (
                        SELECT ""Id"" FROM ""Users""
                        WHERE ""TenantId"" = current_setting('app.current_tenant_id', true)::uuid
                    ));

                -- Subscriptions: tenant-scoped
                ALTER TABLE ""Subscriptions"" ENABLE ROW LEVEL SECURITY;
                CREATE POLICY subscription_tenant_isolation ON ""Subscriptions""
                    AS PERMISSIVE
                    FOR ALL
                    USING (""TenantId"" = current_setting('app.current_tenant_id', true)::uuid);
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                DROP POLICY IF EXISTS subscription_tenant_isolation ON ""Subscriptions"";
                ALTER TABLE ""Subscriptions"" DISABLE ROW LEVEL SECURITY;

                DROP POLICY IF EXISTS refreshtoken_user_isolation ON ""RefreshTokens"";
                ALTER TABLE ""RefreshTokens"" DISABLE ROW LEVEL SECURITY;

                DROP POLICY IF EXISTS auditlog_tenant_isolation ON ""AuditLogs"";
                ALTER TABLE ""AuditLogs"" DISABLE ROW LEVEL SECURITY;

                DROP POLICY IF EXISTS receipt_tenant_isolation ON ""Receipts"";
                ALTER TABLE ""Receipts"" DISABLE ROW LEVEL SECURITY;

                DROP POLICY IF EXISTS expense_tenant_isolation ON ""Expenses"";
                ALTER TABLE ""Expenses"" DISABLE ROW LEVEL SECURITY;

                DROP POLICY IF EXISTS user_tenant_isolation ON ""Users"";
                ALTER TABLE ""Users"" DISABLE ROW LEVEL SECURITY;

                DROP POLICY IF EXISTS tenant_isolation_select ON ""Tenants"";
                ALTER TABLE ""Tenants"" DISABLE ROW LEVEL SECURITY;
            ");
        }
    }
}