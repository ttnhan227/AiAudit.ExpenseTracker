# AI Audit Expense Tracker

Full-stack SaaS platform for enterprise expense management with AI-powered receipt processing, multi-tenant architecture, and role-based access control.

## Tech Stack

**Backend:** .NET 10 • C# • ASP.NET Core • Entity Framework Core • PostgreSQL • JWT • Mistral AI

**Frontend:** React 18 • TypeScript • React Router • Tailwind CSS • ShadcnUI

## Features

- **AI Receipt Processing** - Mistral AI integration for automatic receipt OCR and data extraction
- **Multi-Tenant Architecture** - Complete data isolation with claim-based tenant resolution
- **Role-Based Access Control** - Three-tier permission system (Admin, Manager, User) enforced across routes, endpoints, and services
- **Secure Authentication** - JWT tokens with refresh rotation and invite-based user onboarding (7-day token expiry)
- **Expense Workflow** - Draft → Submit → Approve/Reject with audit trail and status tracking
- **Admin Dashboard** - User management, role assignment, and subscription control

## Architecture

**Three-Tier Design:** Controllers → Services → Repositories with dependency injection and abstraction

**Multi-Tenant Isolation:** Tenant ID extracted from JWT claims; all queries scoped at repository layer

**Authorization:** Role enforcement at 3 layers—route guards, endpoint attributes `[Authorize(Roles="...")]`, service-level validation

**Key Patterns:**
- Repository pattern for testable, optimized data access
- Entity Framework Core migrations for schema versioning
- Claim-based RBAC with request-time IsActive validation
- Guid-based invite tokens with expiry enforcement

## Permissions

| Feature | Admin | Manager | User |
|---------|:-----:|:-------:|:----:|
| Create/Submit Expenses | ✓ | | ✓ |
| Review & Approve | ✓ | ✓ | |
| Upload Receipts | ✓ | | ✓ |
| Manage Users & Roles | ✓ | | |
| View Analytics | ✓ | ✓ | |
| Manage Subscriptions | ✓ | | |

## Setup

### Backend
```bash
cd server
dotnet ef database update -c AppDbContext
dotnet run
```
API: `https://localhost:7218` (HTTPS) or `http://localhost:5291` (HTTP)  
Swagger: `/swagger`

### Frontend
```bash
cd client
bun install
# Set VITE_API_URL=https://localhost:7218 in .env.local
bun run dev
```
App: `http://localhost:5173`

## API Endpoints

**Authentication**
- `POST /auth/register` - Tenant registration
- `POST /auth/login` - Login (returns JWT + refresh token)
- `POST /auth/accept-invite` - Accept invite & set password
- `POST /auth/refresh` - Refresh access token

**Expenses**
- `GET /api/expenses` - List expenses with filtering
- `POST /api/expenses` - Create expense
- `PUT /api/expenses/:id` - Update expense
- `POST /api/expenses/:id/submit` - Submit for approval

**Admin User Management**
- `GET /admin/users` - List tenant users
- `POST /admin/users` - Invite new user
- `PUT /admin/users/:id/role` - Change user role
- `PUT /admin/users/:id/status` - Activate/deactivate user

**AI Receipt Processing**
- `POST /api/ai/upload` - Upload receipt
- `PUT /api/ai/confirm` - Confirm extracted data

## Implementation Highlights

**Invite-Based Onboarding**
- Admin generates 7-day invite token (Guid-based, 128-bit entropy)
- User sets own password via public endpoint
- Token automatically expires and is cleared after acceptance
- Self-deactivation prevention with minimum active admin enforcement

**Request-Time Access Control**
- Middleware validates `user.IsActive` on every authenticated request
- Inactive users blocked immediately upon deactivation
- Full session termination (not just token expiry)

**Multi-Tenant Data Isolation**
- Tenant ID extracted from JWT claims and enforced at repository layer
- No cross-tenant data leakage—all queries filtered by TenantId
- Audit logs fully isolated per tenant

**Security**
- JWT with configurable expiration and refresh token rotation
- Password hashing with bcrypt
- SQL injection prevention via EF Core parameterization
- Self-edit validation at both frontend and backend

## What This Demonstrates

- Full-stack SaaS development with enterprise patterns
- Multi-tenant architecture design and implementation
- Role-based authorization at multiple layers
- Secure authentication flows with token lifecycle management
- Repository pattern for clean, testable data access
- Frontend integration with TypeScript type safety and React best practices
- API design with proper HTTP semantics and error handling
