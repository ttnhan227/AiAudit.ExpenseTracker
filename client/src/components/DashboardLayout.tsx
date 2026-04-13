import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Leaf,
  BarChart3,
  FileText,
  Plus,
  Upload,
  Settings,
  LogOut,
  Menu,
  X,
  CheckCircle,
  Activity,
  ShieldCheck,
  CreditCard,
  Users,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/ThemeToggle";
import { cn } from "@/lib/utils";

export const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isManager = user?.role === "Manager" || user?.role === "Admin";
  const isAdmin = user?.role === "Admin";
  const canUseSubmitterFeatures = user?.role === "Admin" || user?.role === "User";
  const isManagerOnly = user?.role === "Manager";
  const initials = user?.email?.slice(0, 2).toUpperCase() ?? "AI";

  const navItems = [
    { href: "/dashboard", icon: BarChart3, label: "Dashboard" },
    { href: "/expenses", icon: FileText, label: "Expenses" },
    ...(canUseSubmitterFeatures
      ? [
          { href: "/expenses/create", icon: Plus, label: "New Expense" },
          { href: "/upload", icon: Upload, label: "Upload Receipt" },
        ]
      : []),
    ...(isManager
      ? [
          { href: "/manager/pending", icon: CheckCircle, label: "Pending Review" },
          { href: "/manager/insights", icon: Activity, label: "Audit Insights" },
        ]
      : []),
    ...(isAdmin
      ? [
          { href: "/settings/policy", icon: ShieldCheck, label: "Policy Settings" },
          { href: "/admin/users", icon: Users, label: "User Management" },
        ]
      : []),
    ...(!isManagerOnly
      ? [
          { href: "/subscription", icon: CreditCard, label: "Subscription" },
        ]
      : []),
    { href: "/settings", icon: Settings, label: "Settings" },
  ];

  const isActive = (href: string) => location.pathname === href;

  return (
    <div className="relative flex min-h-screen overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_hsl(var(--primary)/0.12),_transparent_28%),radial-gradient(circle_at_bottom_right,_hsl(var(--secondary-foreground)/0.08),_transparent_24%)]" />
      {sidebarOpen && (
        <button
          aria-label="Close navigation"
          className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 border-r border-border/60 bg-card/95 shadow-2xl backdrop-blur-xl transition-transform md:relative md:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-border/60 px-5">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-primary shadow-[0_10px_30px_-12px_hsl(var(--primary))]">
              <Leaf className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <span className="block font-semibold text-foreground">AuditAI</span>
              <span className="block text-[11px] uppercase tracking-[0.24em] text-muted-foreground">Spend governance</span>
            </div>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className="space-y-1 px-3 py-5">
          {navItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              onClick={() => setSidebarOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all",
                isActive(item.href)
                  ? "bg-primary text-primary-foreground shadow-[0_16px_40px_-24px_hsl(var(--primary))]"
                  : "text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="mx-3 mt-auto rounded-3xl border border-border/60 bg-secondary/40 p-4">
          <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Workspace</p>
          <p className="mt-2 text-sm font-medium text-foreground">{user?.companyName ?? "AuditAI tenant"}</p>
          <p className="mt-1 text-sm text-muted-foreground">Role: {user?.role ?? "User"}</p>
        </div>
      </aside>

      {/* Main content */}
      <div className="relative z-10 flex-1 overflow-hidden">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border/60 bg-background/80 px-4 backdrop-blur-xl md:px-8">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <Menu className="h-5 w-5" />
          </Button>

          <div className="flex-1" />

          <div className="flex items-center gap-3">
            <ThemeToggle className="border border-border/60 bg-card/80 hover:bg-card" />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-auto rounded-2xl border border-border/60 bg-card/80 px-3 py-2 shadow-sm hover:bg-card">
                  <div className="mr-3 flex h-9 w-9 items-center justify-center rounded-2xl bg-primary/15 text-sm font-semibold text-primary">
                    {initials}
                  </div>
                  <div className="text-right leading-tight">
                    <p className="text-sm font-medium">{user?.email}</p>
                    <p className="text-xs text-muted-foreground">{user?.role}</p>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div>
                    <p className="font-semibold">{user?.email}</p>
                    <p className="text-xs text-muted-foreground">{user?.companyName}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/settings">Settings</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={logout}
                  className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page content */}
        <main className="h-[calc(100vh-4rem)] overflow-auto">
          <div className="mx-auto max-w-7xl p-4 md:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
};
