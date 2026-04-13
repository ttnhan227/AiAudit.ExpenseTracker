import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { expenseService, ExpenseStats } from "@/services/expenseService";
import { managerService, AuditInsight } from "@/services/managerService";
import { subscriptionService, CurrentSubscription } from "@/services/subscriptionService";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  DollarSign,
  TrendingUp,
  AlertCircle,
  Clock,
  Plus,
  Upload,
  Loader2,
  ShieldAlert,
  CreditCard,
  Calendar,
} from "lucide-react";

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<ExpenseStats | null>(null);
  const [subscription, setSubscription] = useState<CurrentSubscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [auditInsights, setAuditInsights] = useState<AuditInsight | null>(null);
  const isManager = user?.role === "Manager" || user?.role === "Admin";
  const canUseSubmitterFeatures = user?.role === "Admin" || user?.role === "User";
  const canAccessSubscription = user?.role === "Admin" || user?.role === "User";

  useEffect(() => {
    const fetchStats = async () => {
      const result = await expenseService.getStats();
      if (result.success && result.data) {
        setStats(result.data);
      }
      setIsLoading(false);
    };

    fetchStats();
  }, []);

  useEffect(() => {
    if (!canAccessSubscription) return;
    const fetchSubscription = async () => {
      const result = await subscriptionService.getCurrentSubscription();
      if (result.success && result.data) {
        setSubscription(result.data);
      }
    };

    fetchSubscription();
  }, [canAccessSubscription]);

  useEffect(() => {
    if (!isManager) return;
    const fetchInsights = async () => {
      const result = await managerService.getAuditInsights();
      if (result.success && result.data) {
        setAuditInsights(result.data);
      }
    };
    fetchInsights();
  }, [isManager]);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex h-96 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  const COLORS = ["#98d8c8", "#6ecdc1", "#52b6a0", "#3a8b7d", "#23675d"];

  const categoryData = stats?.insights.topCategories || [];
  const chartData = [
    { name: "Current Month", value: stats?.insights.currentMonthTotal || 0 },
    { name: "Previous Month", value: stats?.insights.previousMonthTotal || 0 },
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="rounded-[2rem] border border-border/60 bg-card/80 p-6 shadow-sm backdrop-blur">
          <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">Overview</p>
          <h1 className="mt-2 text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="mt-1 text-muted-foreground">Governance view for {user?.email} with risk, trend, and review priorities.</p>
        </div>

        {/* Subscription Widget */}
        {canAccessSubscription && subscription && (
          <Card className={`rounded-[2rem] bg-gradient-to-br shadow-sm backdrop-blur border ${
            subscription.status === "active" 
              ? "border-primary/20 from-primary/5 to-primary/2" 
              : "border-destructive/20 from-destructive/5 to-destructive/2"
          }`}>
            <CardContent className="flex items-center justify-between pt-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <CreditCard className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">{subscription.planName} Plan</p>
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Calendar className="h-3 w-3" />
                    Renews {new Date(subscription.renewalDate!).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <Button asChild variant="outline" className="rounded-full">
                <Link to="/subscription">Manage Subscription</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {canAccessSubscription && !subscription && (
          <Card className="rounded-[2rem] border-dashed border-border/60 bg-card/50 shadow-sm">
            <CardContent className="flex items-center justify-between pt-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
                  <CreditCard className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium text-foreground">No Active Subscription</p>
                  <p className="text-sm text-muted-foreground">Choose a plan to unlock premium features</p>
                </div>
              </div>
              <Button asChild className="rounded-full bg-primary hover:bg-primary/90">
                <Link to="/subscription">Choose Plan</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        {canUseSubmitterFeatures && (
          <div className="grid gap-4 md:grid-cols-2">
            <Button asChild size="lg" className="gap-2">
              <Link to="/expenses/create">
                <Plus className="h-5 w-5" />
                New Expense
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="gap-2">
              <Link to="/upload">
                <Upload className="h-5 w-5" />
                Upload Receipt
              </Link>
            </Button>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="rounded-[2rem] border-border/60 bg-card/85 shadow-sm backdrop-blur">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Spending</CardTitle>
              <DollarSign className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats?.totalSpent || 0)}</div>
              <p className="text-xs text-muted-foreground">
                Across {stats?.expenseCount || 0} expenses
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-[2rem] border-border/60 bg-card/85 shadow-sm backdrop-blur">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Spend</CardTitle>
              <TrendingUp className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats?.averageSpend || 0)}</div>
              <p className="text-xs text-muted-foreground">Per expense</p>
            </CardContent>
          </Card>

          <Card className="rounded-[2rem] border-border/60 bg-card/85 shadow-sm backdrop-blur">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
              <Clock className="h-4 w-4 text-secondary-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.pendingCount || 0}</div>
              <p className="text-xs text-muted-foreground">Awaiting approval</p>
            </CardContent>
          </Card>

          <Card className="rounded-[2rem] border-border/60 bg-card/85 shadow-sm backdrop-blur">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">High Risk</CardTitle>
              <AlertCircle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.highRiskCount || 0}</div>
              <p className="text-xs text-muted-foreground">
                Avg score: {Math.round(stats?.averageRiskScore || 0)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Monthly Comparison */}
          <Card className="rounded-[2rem] border-border/60 bg-card/85 shadow-sm backdrop-blur">
            <CardHeader>
              <CardTitle>Monthly Comparison</CardTitle>
              <CardDescription>Current and previous month spending</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                    }}
                  />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Category Distribution */}
          {categoryData.length > 0 && (
            <Card className="rounded-[2rem] border-border/60 bg-card/85 shadow-sm backdrop-blur">
              <CardHeader>
                <CardTitle>Top Categories</CardTitle>
                <CardDescription>By spending amount</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ category, totalSpent }) =>
                        `${category}: ${Math.round((totalSpent / (stats?.totalSpent || 1)) * 100)}%`
                      }
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="totalSpent"
                    >
                      {categoryData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Insights */}
        <Card className="rounded-[2rem] border-border/60 bg-secondary/35 shadow-sm backdrop-blur">
          <CardHeader>
            <CardTitle>Month-over-Month Change</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Amount Change</span>
              <Badge
                variant={
                  (stats?.insights.changeAmount || 0) > 0 ? "destructive" : "secondary"
                }
              >
                {stats?.insights.changeAmount ? formatCurrency(stats.insights.changeAmount) : "0"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Percentage Change</span>
              <Badge variant={(stats?.insights.changePercentage || 0) > 0 ? "destructive" : "secondary"}>
                {Math.round((stats?.insights.changePercentage || 0) * 100) / 100}%
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Quick Links for Managers */}
        {isManager && (
          <Card className="rounded-[2rem] border-border/60 bg-primary/5 shadow-sm backdrop-blur">
            <CardHeader>
              <CardTitle>Decision Support Actions</CardTitle>
            </CardHeader>
            <CardContent className="flex gap-4">
              <Button asChild variant="outline">
                <Link to="/manager/pending">Review Pending Expenses</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/manager/insights">View Audit Insights</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Anomaly Trend — managers only */}
        {isManager && auditInsights && (
          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="rounded-[2rem] border-border/60 bg-card/85 shadow-sm backdrop-blur">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-destructive" />
                  <CardTitle>High-Risk Trend</CardTitle>
                </div>
                <CardDescription>Monthly high-risk claim volume over last 6 months</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={auditInsights.monthlyHighRiskTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="monthLabel" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 11 }} />
                    <YAxis stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="highRiskCount" name="High-Risk" stroke="hsl(var(--destructive))" strokeWidth={2} dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="reviewedCount" name="Reviewed" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="rounded-[2rem] border-border/60 bg-card/85 shadow-sm backdrop-blur">
              <CardHeader>
                <CardTitle>Top Flagged Categories</CardTitle>
                <CardDescription>Categories by flag rate across your organization</CardDescription>
              </CardHeader>
              <CardContent>
                {auditInsights.highestFlaggedCategories.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-6 text-center">No flagged categories yet.</p>
                ) : (
                  <div className="space-y-3 pt-1">
                    {auditInsights.highestFlaggedCategories.map((cat) => (
                      <div key={cat.category}>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="font-medium">{cat.category}</span>
                          <span className="text-muted-foreground">{cat.flaggedCount}/{cat.expenseCount} · {cat.flagRate}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-secondary/50 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-destructive/70"
                            style={{ width: `${Math.min(cat.flagRate, 100)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
