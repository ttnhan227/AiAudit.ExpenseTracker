# AI Audit Expense Tracker

Full-stack SaaS platform for enterprise expense management with AI-powered receipt processing, multi-tenant architecture, and role-based access control.

## Live Links

- **Live Demo:** https://aiaudit-expensetracker-web.onrender.com
- **Swagger API:** https://aiaudit-expensetracker.onrender.com/swagger
> Backend services are hosted on Render free tier and may take ~30–60 seconds to wake after inactivity.

## Tech Stack

### Backend

- .NET 10, C#, ASP.NET Core
- Entity Framework Core, PostgreSQL
- JWT Authentication, Mistral AI

### Frontend

- React 18, TypeScript, React Router
- Tailwind CSS, ShadcnUI, TanStack Query

### DevOps & Tooling

- Docker, GitHub Actions CI/CD, Render, Git

## Features

- **AI Receipt Processing** — Mistral AI OCR and structured expense extraction
- **Multi-Tenant Architecture** — Tenant isolation enforced through JWT claims and repository-layer filtering
- **Role-Based Access Control** — Admin / Manager / User authorization across frontend routes, API endpoints, and services
- **Secure Authentication** — JWT access tokens with refresh token rotation and invite-based onboarding
- **Expense Workflow** — Draft → Submit → Approve/Reject lifecycle with audit logging
- **Admin Dashboard** — User management, role assignment, and subscription management
- **Analytics & Reporting** — KPI insights, audit metrics, and CSV export functionality

## Architecture

### Three-Tier Backend Design

Controllers → Services → Repositories with dependency injection.

### Multi-Tenant Isolation

- Tenant ID extracted from JWT claims
- Repository-layer query scoping
- Full tenant-level data isolation

### Authorization

- Frontend route guards
- `[Authorize(Roles="...")]` endpoint protection
- Service-level validation

### Key Patterns

- Repository pattern for testable data access
- EF Core migrations for schema versioning
- Request-time `IsActive` validation
- Refresh token rotation

### API Modules

The API is organized by module and secured with role-based access:

- **Auth** — Registration, login, refresh tokens, and invite acceptance
- **Expenses** — Expense CRUD, submission workflow, and approval actions
- **AI** — Receipt upload and extraction confirmation
- **Admin Users** — User invites, role updates, activation/deactivation
- **Manager** — Team oversight and manager-scoped operations
- **Subscriptions** — Tenant subscription and plan lifecycle management
- **Settings** — Tenant configuration and application preferences

For a complete route list, see Swagger at `/swagger`.

## Security

### Invite-Based Onboarding

- Admin generates 7-day invite token (Guid-based, 128-bit entropy)
- User sets own password via public endpoint
- Token expires automatically after acceptance
- Minimum active admin enforcement

### Request-Time Access Control

- Middleware validates `user.IsActive` on every authenticated request
- Inactive users blocked immediately upon deactivation
- Full session termination beyond token expiry

### Multi-Tenant Data Isolation

- Tenant ID extracted from JWT claims
- Repository-layer filtering for all queries
- Fully isolated audit logs and tenant data

### Security Measures

- JWT authentication with refresh token rotation
- BCrypt password hashing
- EF Core parameterized queries
- Frontend + backend validation

## Deployment

The application is deployed on Render using separate services:

- React frontend (Static Site)
- Dockerized ASP.NET Core API (Web Service)
- PostgreSQL managed database

GitHub Actions workflows automate .NET/build/test, React lint/test/build, Docker image validation, and automatic Render deployment on pushes to `main`.

## Permissions

| Feature | Admin | Manager | User |
|---------|:-----:|:-------:|:----:|
| Create/Submit Expenses | ✓ | | ✓ |
| Review & Approve | ✓ | ✓ | |
| Upload Receipts | ✓ | | ✓ |
| Manage Users & Roles | ✓ | | |
| View Analytics | ✓ | ✓ | |
| Manage Subscriptions | ✓ | | |

## Local Development

### Prerequisites

- .NET 10 SDK
- PostgreSQL 15+
- Node.js 20+ (or Bun)
- Mistral AI API key

### Environment Variables

```bash
# Server: server/appsettings.Development.json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5432;Database=AiAuditExpenseTracker;Username=postgres;Password=your_password"
  },
  "JwtSettings": {
    "Secret": "your-jwt-secret-key"
  },
  "MistralSettings": {
    "ApiKey": "your-mistral-api-key"
  }
}

# Frontend: client/.env.local
VITE_API_URL=https://localhost:7218
```

### Backend

```bash
cd server
dotnet ef database update -c AppDbContext
dotnet run
```

API: https://localhost:7218 or http://localhost:5291 | Swagger: `/swagger`

### Frontend

```bash
cd client
bun install
bun run dev
```

App: http://localhost:5173

### Development Commands

```bash
# Tests
cd server && dotnet test
cd client && npm test

# Migrations
cd server
dotnet ef migrations add <MigrationName> -c AppDbContext
dotnet ef database update -c AppDbContext

# Docker
cd server && docker build -t expense-tracker . && docker run -p 8080:8080 expense-tracker
```

## Project Structure

```text
server/                 # Backend (.NET)
├── Controllers/        # API endpoints
├── Services/           # Business logic
├── Repositories/       # Data access
├── Models/             # EF Core entities
├── Dtos/               # Data transfer objects
└── Migrations/         # EF Core migrations

client/                 # Frontend (React)
├── src/
│   ├── pages/          # Route components
│   ├── components/     # UI components
│   ├── services/       # API clients
│   └── contexts/       # React contexts
└── public/
```

## License

MIT