using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Server.Models;

namespace Server.Data;

public static class DatabaseSeeder
{
    public static async Task SeedAsync(AppDbContext context)
    {
        await context.Database.MigrateAsync();

        if (await context.Tenants.AnyAsync())
        {
            return;
        }

        var now = DateTime.UtcNow;
        var tenantSeeds = BuildTenantSeeds(now);

        var tenants = new List<Tenant>();
        var users = new List<User>();
        var expenses = new List<Expense>();
        var receipts = new List<Receipt>();
        var auditLogs = new List<AuditLog>();
        var refreshTokens = new List<RefreshToken>();
        var sharedPasswordHash = Services.PasswordHasher.Hash("123");

        foreach (var tenantSeed in tenantSeeds)
        {
            var tenant = new Tenant
            {
                Id = Guid.NewGuid(),
                CompanyName = tenantSeed.CompanyName,
                ApiKey = tenantSeed.ApiKey,
                PlanType = tenantSeed.PlanType,
                MaxSpendLimit = tenantSeed.MaxSpendLimit,
                PolicyNotes = tenantSeed.PolicyNotes
            };

            tenants.Add(tenant);

            foreach (var userSeed in tenantSeed.Users)
            {
                var user = new User
                {
                    Id = Guid.NewGuid(),
                    Email = userSeed.Email,
                    PasswordHash = sharedPasswordHash,
                    Role = userSeed.Role,
                    Tenant = tenant
                };

                users.Add(user);
                refreshTokens.Add(new RefreshToken
                {
                    Id = Guid.NewGuid(),
                    User = user,
                    Token = Guid.NewGuid().ToString("N"),
                    ExpiresAt = now.AddDays(30),
                    Revoked = false
                });

                foreach (var expenseSeed in userSeed.Expenses)
                {
                    var expense = new Expense
                    {
                        Id = Guid.NewGuid(),
                        Tenant = tenant,
                        User = user,
                        Amount = expenseSeed.Amount,
                        Currency = expenseSeed.Currency,
                        Merchant = expenseSeed.Merchant,
                        Category = expenseSeed.Category,
                        Status = expenseSeed.Status,
                        Date = expenseSeed.ExpenseDate,
                        Description = expenseSeed.Description,
                        Flagged = expenseSeed.Flagged,
                        FlagReason = expenseSeed.FlagReason,
                        CreatedAt = expenseSeed.CreatedAt,
                        UpdatedAt = expenseSeed.UpdatedAt
                    };

                    expenses.Add(expense);
                    receipts.Add(new Receipt
                    {
                        Id = Guid.NewGuid(),
                        Expense = expense,
                        FileUrl = expenseSeed.ReceiptFile,
                        OcrRawData = JsonSerializer.Serialize(new
                        {
                            merchant = expenseSeed.Merchant,
                            total = expenseSeed.Amount,
                            currency = expenseSeed.Currency,
                            expenseDate = expenseSeed.ExpenseDate.ToString("yyyy-MM-dd"),
                            category = expenseSeed.Category
                        })
                    });

                    auditLogs.AddRange(BuildAuditLogs(expense, user.Email, expenseSeed));
                }
            }
        }

        context.Tenants.AddRange(tenants);
        context.Users.AddRange(users);
        context.Expenses.AddRange(expenses);
        context.Receipts.AddRange(receipts);
        context.AuditLogs.AddRange(auditLogs);
        context.RefreshTokens.AddRange(refreshTokens);

        await context.SaveChangesAsync();
    }

    private static List<AuditLog> BuildAuditLogs(Expense expense, string email, ExpenseSeed seed)
    {
        var logs = new List<AuditLog>
        {
            new()
            {
                Id = Guid.NewGuid(),
                Expense = expense,
                Action = "Created",
                PerformedBy = email,
                Timestamp = seed.CreatedAt,
                OldValue = null,
                NewValue = SerializeSnapshot(seed, "Draft"),
                Notes = seed.CreateNote
            }
        };

        if (seed.Status is "Pending" or "Approved" or "Rejected")
        {
            logs.Add(new AuditLog
            {
                Id = Guid.NewGuid(),
                Expense = expense,
                Action = "Submitted",
                PerformedBy = email,
                Timestamp = seed.CreatedAt.AddHours(3),
                OldValue = SerializeSnapshot(seed, "Draft"),
                NewValue = SerializeSnapshot(seed, "Pending"),
                Notes = seed.SubmittedNote ?? "Submitted for manager review."
            });
        }

        if (seed.Status is "Approved" or "Rejected")
        {
            var finalStatus = seed.Status;
            logs.Add(new AuditLog
            {
                Id = Guid.NewGuid(),
                Expense = expense,
                Action = finalStatus,
                PerformedBy = seed.ReviewedBy ?? email,
                Timestamp = seed.UpdatedAt ?? seed.CreatedAt.AddHours(8),
                OldValue = SerializeSnapshot(seed, "Pending"),
                NewValue = SerializeSnapshot(seed, finalStatus),
                Notes = seed.ReviewNote
            });
        }

        return logs;
    }

    private static string SerializeSnapshot(ExpenseSeed seed, string status)
    {
        return JsonSerializer.Serialize(new
        {
            amount = seed.Amount,
            currency = seed.Currency,
            merchant = seed.Merchant,
            category = seed.Category,
            description = seed.Description,
            status,
            flagged = seed.Flagged,
            flagReason = seed.FlagReason,
            expenseDate = seed.ExpenseDate
        });
    }

    private static TenantSeed[] BuildTenantSeeds(DateTime now)
    {
        return
        [
            new TenantSeed(
                "Northwind Analytics",
                "northwind-analytics-demo-key",
                "Growth",
                7500m,
                "Airfare above $1,000 requires finance approval within 48 hours, and client entertainment needs agenda notes.",
                [
                    new UserSeed(
                        "admin@admin.com",
                        "Admin",
                        [
                            Expense("Delta Air Lines", "Travel", 428.60m, "Approved", now.AddDays(-20), "Round-trip flight to Chicago for the quarterly client review.", "/uploads/northwind-delta-flight.jpg", reviewNote: "Approved by finance for planned client travel.", reviewedBy: "olivia.chen@northwindanalytics.com"),
                            Expense("JW Marriott Austin", "Lodging", 612.40m, "Pending", now.AddDays(-5), "Two nights for the leadership offsite with customer success leads.", "/uploads/northwind-marriott-austin.jpg", submittedNote: "Awaiting final approval for offsite lodging."),
                            Expense("Uber", "Ground Transport", 64.20m, "Draft", now.AddDays(-1), "Airport transfer after the Austin leadership offsite.", "/uploads/northwind-uber-airport.jpg", createNote: "Saved as draft while waiting for final receipt.")
                        ]),
                    new UserSeed(
                        "olivia.chen@northwindanalytics.com",
                        "Manager",
                        [
                            Expense("Salesforce", "Software", 329.00m, "Approved", now.AddDays(-15), "Monthly CRM add-on licenses for enterprise account planning.", "/uploads/northwind-salesforce.jpg", reviewNote: "Approved as part of recurring software spend."),
                            Expense("Blue Bottle Coffee", "Meals", 142.85m, "Rejected", now.AddDays(-8), "Coffee meeting with prospective implementation partner.", "/uploads/northwind-bluebottle.jpg", true, "Expense triggered policy review.", "Rejected because attendee list was missing.", reviewedBy: "admin@admin.com"),
                            Expense("Canva", "Software", 96.00m, "Pending", now.AddDays(-3), "Presentation design subscription for investor update materials.", "/uploads/northwind-canva.jpg")
                        ]),
                    new UserSeed(
                        "marco.silva@northwindanalytics.com",
                        "User",
                        [
                            Expense("United Airlines", "Travel", 1184.20m, "Pending", now.AddDays(-6), "Flight to New York for enterprise renewal workshop.", "/uploads/northwind-united-nyc.jpg", true, "Amount exceeds tenant review threshold.", "Flagged automatically because airfare exceeded standard review band."),
                            Expense("Hilton Midtown", "Lodging", 884.55m, "Approved", now.AddDays(-11), "Hotel stay during the New York renewal workshop.", "/uploads/northwind-hilton-midtown.jpg", reviewNote: "Approved with attached itinerary.", reviewedBy: "olivia.chen@northwindanalytics.com"),
                            Expense("Staples", "Office Supplies", 73.14m, "Approved", now.AddDays(-14), "Replacement notebooks and whiteboard supplies for the analytics squad.", "/uploads/northwind-staples.jpg", reviewNote: "Approved as normal office supply reimbursement.", reviewedBy: "olivia.chen@northwindanalytics.com")
                        ]),
                    new UserSeed(
                        "nina.kapoor@northwindanalytics.com",
                        "User",
                        [
                            Expense("Adobe", "Software", 89.99m, "Approved", now.AddDays(-18), "Monthly Adobe license for customer-facing deck production.", "/uploads/northwind-adobe.jpg", reviewNote: "Approved recurring subscription."),
                            Expense("Lyft", "Ground Transport", 38.70m, "Approved", now.AddDays(-9), "Client-site commute after transit delay.", "/uploads/northwind-lyft-client.jpg", reviewNote: "Approved with supporting schedule note."),
                            Expense("The Smith", "Meals", 221.40m, "Pending", now.AddDays(-2), "Dinner with procurement contacts after renewal negotiations.", "/uploads/northwind-the-smith.jpg", true, "Expense triggered policy review.", "Pending review due to client entertainment category.")
                        ])
                ]),
            new TenantSeed(
                "Blue Harbor Logistics",
                "blue-harbor-logistics-demo-key",
                "Business",
                5200m,
                "Meals are reimbursable only when tied to recruiting, customer, or carrier negotiations, and fuel overages need route notes.",
                [
                    new UserSeed(
                        "daniel.kim@blueharborlogistics.com",
                        "Admin",
                        [
                            Expense("Harbor Grill", "Meals", 186.25m, "Approved", now.AddDays(-12), "Team dinner with regional warehouse partners after Q1 planning.", "/uploads/blueharbor-harbor-grill.jpg", reviewNote: "Approved with attendee list and planning agenda."),
                            Expense("Marriott Long Beach", "Travel", 544.10m, "Pending", now.AddDays(-4), "One-night stay before carrier contract review.", "/uploads/blueharbor-marriott.jpg"),
                            Expense("Chevron", "Fuel", 93.48m, "Draft", now.AddDays(-1), "Rental van fuel refill for site visit in Carson.", "/uploads/blueharbor-chevron.jpg", createNote: "Draft saved pending fuel receipt scan.")
                        ]),
                    new UserSeed(
                        "priya.nair@blueharborlogistics.com",
                        "Manager",
                        [
                            Expense("Southwest Airlines", "Travel", 378.60m, "Approved", now.AddDays(-16), "Flight to Phoenix to evaluate carrier handoff operations.", "/uploads/blueharbor-southwest.jpg", reviewNote: "Approved for network operations visit.", reviewedBy: "daniel.kim@blueharborlogistics.com"),
                            Expense("Office Depot", "Office Supplies", 128.37m, "Approved", now.AddDays(-10), "Printer toner and labels for dispatch office.", "/uploads/blueharbor-officedepot.jpg", reviewNote: "Approved as routine office supply expense.", reviewedBy: "daniel.kim@blueharborlogistics.com"),
                            Expense("Enterprise", "Transport", 412.75m, "Rejected", now.AddDays(-7), "Rental vehicle for warehouse transfer audit.", "/uploads/blueharbor-enterprise.jpg", true, "Expense triggered policy review.", "Rejected because mileage logs were incomplete.", reviewedBy: "daniel.kim@blueharborlogistics.com")
                        ]),
                    new UserSeed(
                        "lucas.meyer@blueharborlogistics.com",
                        "User",
                        [
                            Expense("FedEx Office", "Shipping", 58.20m, "Approved", now.AddDays(-9), "Printed and shipped customs packets for port onboarding.", "/uploads/blueharbor-fedex.jpg", reviewNote: "Approved as project shipping cost."),
                            Expense("Shell", "Fuel", 147.19m, "Pending", now.AddDays(-3), "Fuel for a three-day route coverage visit across Orange County.", "/uploads/blueharbor-shell.jpg"),
                            Expense("Holiday Inn Express", "Lodging", 299.99m, "Approved", now.AddDays(-20), "Overnight stay during warehouse systems rollout.", "/uploads/blueharbor-holidayinn.jpg", reviewNote: "Approved against rollout budget.", reviewedBy: "priya.nair@blueharborlogistics.com")
                        ]),
                    new UserSeed(
                        "sofia.ortega@blueharborlogistics.com",
                        "User",
                        [
                            Expense("Zoom", "Software", 159.00m, "Approved", now.AddDays(-13), "Quarterly webinar add-on for recruiting and carrier briefings.", "/uploads/blueharbor-zoom.jpg", reviewNote: "Approved recurring collaboration software."),
                            Expense("Chipotle", "Meals", 67.45m, "Pending", now.AddDays(-2), "Lunch during same-day candidate interview loop.", "/uploads/blueharbor-chipotle.jpg"),
                            Expense("Lowe's", "Maintenance", 214.84m, "Approved", now.AddDays(-6), "Safety signage and shelving hardware for dock staging area.", "/uploads/blueharbor-lowes.jpg", reviewNote: "Approved under warehouse safety budget.", reviewedBy: "priya.nair@blueharborlogistics.com")
                        ])
                ]),
            new TenantSeed(
                "CedarStone Design Studio",
                "cedarstone-design-demo-key",
                "Startup",
                2800m,
                "Design tools and creative subscriptions must reference an active client or internal campaign code.",
                [
                    new UserSeed(
                        "maya.patel@cedarstonedesign.com",
                        "Admin",
                        [
                            Expense("Adobe", "Software", 89.99m, "Approved", now.AddDays(-21), "Monthly Adobe Creative Cloud subscription for brand design work.", "/uploads/cedarstone-adobe.jpg", reviewNote: "Approved recurring design software subscription."),
                            Expense("Figma", "Software", 180.00m, "Approved", now.AddDays(-14), "Quarterly Figma pro seats for client collaboration.", "/uploads/cedarstone-figma.jpg", reviewNote: "Approved for active client collaboration."),
                            Expense("Notion", "Software", 96.00m, "Pending", now.AddDays(-4), "Workspace upgrade to organize campaign production timelines.", "/uploads/cedarstone-notion.jpg")
                        ]),
                    new UserSeed(
                        "aaron.lee@cedarstonedesign.com",
                        "Manager",
                        [
                            Expense("Canon", "Hardware", 649.00m, "Approved", now.AddDays(-17), "Replacement office camera for product and studio shoots.", "/uploads/cedarstone-canon.jpg", reviewNote: "Approved for studio production work.", reviewedBy: "maya.patel@cedarstonedesign.com"),
                            Expense("WeWork", "Facilities", 420.00m, "Pending", now.AddDays(-5), "Meeting room booking for two-day client concept sprint.", "/uploads/cedarstone-wework.jpg"),
                            Expense("Sweetgreen", "Meals", 133.25m, "Rejected", now.AddDays(-8), "Working lunch during internal creative review.", "/uploads/cedarstone-sweetgreen.jpg", true, "Expense triggered policy review.", "Rejected because internal-only meals are not reimbursable.", reviewedBy: "maya.patel@cedarstonedesign.com")
                        ]),
                    new UserSeed(
                        "zoe.martin@cedarstonedesign.com",
                        "User",
                        [
                            Expense("MOO", "Printing", 248.30m, "Approved", now.AddDays(-10), "Premium print run for fashion client pitch leave-behinds.", "/uploads/cedarstone-moo.jpg", reviewNote: "Approved against client acquisition budget.", reviewedBy: "aaron.lee@cedarstonedesign.com"),
                            Expense("Apple", "Hardware", 1299.00m, "Pending", now.AddDays(-3), "iPad for on-site creative reviews and markup sessions.", "/uploads/cedarstone-ipad.jpg", true, "Expense triggered policy review.", "Pending hardware approval with asset tagging required."),
                            Expense("Dropbox", "Software", 144.00m, "Approved", now.AddDays(-19), "Annual asset archive storage for retainer clients.", "/uploads/cedarstone-dropbox.jpg", reviewNote: "Approved recurring storage expense.", reviewedBy: "aaron.lee@cedarstonedesign.com")
                        ]),
                    new UserSeed(
                        "julian.cross@cedarstonedesign.com",
                        "User",
                        [
                            Expense("B&H Photo", "Equipment", 532.45m, "Approved", now.AddDays(-15), "Lighting accessories and backup batteries for studio shoots.", "/uploads/cedarstone-bhphoto.jpg", reviewNote: "Approved for scheduled production shoots.", reviewedBy: "aaron.lee@cedarstonedesign.com"),
                            Expense("Uber", "Transport", 42.18m, "Approved", now.AddDays(-6), "Late-night ride home after client photo shoot wrap.", "/uploads/cedarstone-uber.jpg", reviewNote: "Approved with late-session note.", reviewedBy: "aaron.lee@cedarstonedesign.com"),
                            Expense("Google Ads", "Marketing", 311.82m, "Pending", now.AddDays(-2), "Paid search spend promoting the studio portfolio launch.", "/uploads/cedarstone-googleads.jpg")
                        ])
                ]),
            new TenantSeed(
                "SummitPeak Consulting",
                "summitpeak-consulting-demo-key",
                "Enterprise",
                12000m,
                "Client-facing travel and lodging require trip purpose notes, and celebratory meals with alcohol are auto-flagged.",
                [
                    new UserSeed(
                        "rachel.stone@summitpeakconsulting.com",
                        "Admin",
                        [
                            Expense("Marriott Downtown", "Travel", 642.15m, "Approved", now.AddDays(-18), "Two-night hotel stay for on-site audit engagement in Seattle.", "/uploads/summitpeak-marriott.jpg", reviewNote: "Approved for billable client travel."),
                            Expense("Alaska Airlines", "Travel", 534.90m, "Approved", now.AddDays(-17), "Round-trip airfare for Seattle audit kickoff.", "/uploads/summitpeak-alaska.jpg", reviewNote: "Approved against client engagement budget."),
                            Expense("Capital Grille", "Meals", 286.00m, "Pending", now.AddDays(-4), "Client dinner after steering committee meeting.", "/uploads/summitpeak-capitalgrille.jpg", true, "Alcohol-related expense requires policy review.", "Pending review because the receipt contains alcohol charges.")
                        ]),
                    new UserSeed(
                        "victor.hale@summitpeakconsulting.com",
                        "Manager",
                        [
                            Expense("Amtrak", "Travel", 142.00m, "Approved", now.AddDays(-12), "Train fare for same-day controls workshop in Portland.", "/uploads/summitpeak-amtrak.jpg", reviewNote: "Approved as lower-cost client travel.", reviewedBy: "rachel.stone@summitpeakconsulting.com"),
                            Expense("Hyatt Regency", "Lodging", 710.25m, "Pending", now.AddDays(-5), "Hotel stay during ERP remediation workshop.", "/uploads/summitpeak-hyatt.jpg"),
                            Expense("Microsoft", "Software", 267.50m, "Approved", now.AddDays(-14), "Power BI premium add-on for audit analytics deliverables.", "/uploads/summitpeak-powerbi.jpg", reviewNote: "Approved as project tooling cost.", reviewedBy: "rachel.stone@summitpeakconsulting.com")
                        ]),
                    new UserSeed(
                        "ethan.rivera@summitpeakconsulting.com",
                        "User",
                        [
                            Expense("United Airlines", "Travel", 1388.45m, "Pending", now.AddDays(-6), "Last-minute client site travel for controls escalation workshop.", "/uploads/summitpeak-united.jpg", true, "Amount exceeds tenant review threshold.", "Pending approval because airfare exceeded the standard review threshold."),
                            Expense("Starbucks", "Meals", 24.60m, "Approved", now.AddDays(-9), "Coffee during same-day client workshop travel.", "/uploads/summitpeak-starbucks.jpg", reviewNote: "Approved as routine travel meal.", reviewedBy: "victor.hale@summitpeakconsulting.com"),
                            Expense("Westin Bellevue", "Lodging", 824.20m, "Rejected", now.AddDays(-11), "Hotel stay extension after client workshop concluded.", "/uploads/summitpeak-westin.jpg", true, "Expense triggered policy review.", "Rejected because the extra night was not tied to client work.", reviewedBy: "victor.hale@summitpeakconsulting.com")
                        ]),
                    new UserSeed(
                        "sophia.bennett@summitpeakconsulting.com",
                        "User",
                        [
                            Expense("Zoom", "Software", 79.00m, "Approved", now.AddDays(-13), "Webinar add-on for control owner training sessions.", "/uploads/summitpeak-zoom.jpg", reviewNote: "Approved recurring training software.", reviewedBy: "victor.hale@summitpeakconsulting.com"),
                            Expense("Uber", "Ground Transport", 88.34m, "Approved", now.AddDays(-7), "Airport transfer and client-office round trip.", "/uploads/summitpeak-uber.jpg", reviewNote: "Approved with itinerary attached.", reviewedBy: "victor.hale@summitpeakconsulting.com"),
                            Expense("Ruth's Chris", "Meals", 314.50m, "Pending", now.AddDays(-2), "Executive dinner after steering committee presentation.", "/uploads/summitpeak-ruthschris.jpg", true, "Alcohol-related expense requires policy review.", "Pending because the receipt includes alcohol and high meal spend.")
                        ])
                ])
        ];
    }

    private static ExpenseSeed Expense(
        string merchant,
        string category,
        decimal amount,
        string status,
        DateTime expenseDate,
        string description,
        string receiptFile,
        bool flagged = false,
        string? flagReason = null,
        string? reviewNote = null,
        string? reviewedBy = null,
        string? submittedNote = null,
        string? createNote = null,
        string currency = "USD")
    {
        var createdAt = expenseDate.AddDays(1);
        DateTime? updatedAt = status is "Approved" or "Rejected"
            ? createdAt.AddDays(1)
            : status == "Pending"
                ? createdAt.AddHours(8)
                : null;

        return new ExpenseSeed(
            merchant,
            category,
            amount,
            currency,
            status,
            expenseDate,
            createdAt,
            updatedAt,
            description,
            flagged,
            flagReason,
            receiptFile,
            createNote ?? "Expense created and saved.",
            submittedNote,
            reviewNote ?? DefaultReviewNote(status),
            reviewedBy);
    }

    private static string? DefaultReviewNote(string status)
    {
        return status switch
        {
            "Approved" => "Approved after policy and receipt review.",
            "Rejected" => "Rejected during manager review.",
            _ => null
        };
    }

    private sealed record TenantSeed(
        string CompanyName,
        string ApiKey,
        string PlanType,
        decimal MaxSpendLimit,
        string PolicyNotes,
        UserSeed[] Users);

    private sealed record UserSeed(
        string Email,
        string Role,
        ExpenseSeed[] Expenses);

    private sealed record ExpenseSeed(
        string Merchant,
        string Category,
        decimal Amount,
        string Currency,
        string Status,
        DateTime ExpenseDate,
        DateTime CreatedAt,
        DateTime? UpdatedAt,
        string Description,
        bool Flagged,
        string? FlagReason,
        string ReceiptFile,
        string CreateNote,
        string? SubmittedNote,
        string? ReviewNote,
        string? ReviewedBy);
}
