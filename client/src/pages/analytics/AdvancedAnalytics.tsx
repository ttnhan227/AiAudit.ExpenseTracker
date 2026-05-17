import React, { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, AlertCircle, TrendingUp, TrendingDown, Minus, BarChart2, CalendarDays, LayoutDashboard } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, ReferenceLine, Legend,
} from "recharts";
import {
  analyticsService,
  DepartmentBudgetPool,
  SeasonalAdjustment,
  CustomKpiDashboard,
  KpiMetric,
} from "@/services/analyticsService";

// ── Helpers ────────────────────────────────────────────────────────────────────

const TrendIcon = ({ trend }: { trend?: string }) => {
  if (trend === "up") return <TrendingUp className="h-4 w-4 text-red-500" />;
  if (trend === "down") return <TrendingDown className="h-4 w-4 text-emerald-500" />;
  return <Minus className="h-4 w-4 text-muted-foreground" />;
};

const KpiCard = ({ metric }: { metric: KpiMetric }) => (
  <Card className="rounded-3xl border border-border bg-card/65 shadow-xl backdrop-blur-md overflow-hidden">
    <CardHeader className="pb-2 bg-muted/20 px-6 py-4 border-b border-border/40">
      <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
        {metric.name}
      </CardTitle>
    </CardHeader>
    <CardContent className="p-6">
      <div className="flex items-end justify-between">
        <p className="text-2xl font-extrabold text-foreground font-mono">
          {metric.value}
          {metric.unit && <span className="ml-1 text-xs font-bold font-sans text-muted-foreground uppercase">{metric.unit}</span>}
        </p>
        {metric.trend && <TrendIcon trend={metric.trend} />}
      </div>
      {metric.trendValue !== undefined && metric.trendValue !== null && (
        <p className="mt-1.5 text-xs text-muted-foreground font-mono">
          {metric.trendValue > 0 ? "+" : ""}{metric.trendValue}% vs last month
        </p>
      )}
    </CardContent>
  </Card>
);

// ── Main Page ─────────────────────────────────────────────────────────────────

const AdvancedAnalytics = () => {
  const [budgetPool, setBudgetPool] = useState<DepartmentBudgetPool | null>(null);
  const [seasonal, setSeasonal] = useState<SeasonalAdjustment | null>(null);
  const [kpiDashboard, setKpiDashboard] = useState<CustomKpiDashboard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAll = async () => {
      setIsLoading(true);
      const [poolRes, seasonalRes, kpiRes] = await Promise.all([
        analyticsService.getDepartmentBudgetPool(),
        analyticsService.getSeasonalAdjustments(),
        analyticsService.getKpiDashboard(),
      ]);

      if (poolRes.success && poolRes.data) setBudgetPool(poolRes.data);
      if (seasonalRes.success && seasonalRes.data) setSeasonal(seasonalRes.data);
      if (kpiRes.success && kpiRes.data) setKpiDashboard(kpiRes.data);

      const firstError = [poolRes, seasonalRes, kpiRes].find((r) => !r.success);
      if (firstError) setError(firstError.error || "Failed to load analytics data");
      setIsLoading(false);
    };
    fetchAll();
  }, []);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex h-96 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 font-sans">
        
        {/* Header Ribbon */}
        <div className="flex items-center gap-4 rounded-3xl border border-border bg-card/65 p-6 shadow-xl backdrop-blur-md">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 text-primary">
            <LayoutDashboard className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <span className="text-[10px] font-mono tracking-[0.28em] text-primary bg-primary/5 px-2 py-0.5 border border-primary/10 rounded uppercase">
              Financial Intelligence
            </span>
            <h1 className="text-3xl font-extrabold tracking-tight mt-1.5">Advanced Analytics</h1>
            <p className="text-sm text-muted-foreground font-sans">
              Department budget pools, seasonal spending anomalies, and real-time custom financial KPIs.
            </p>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="rounded-xl">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs font-semibold">{error}</AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="kpi" className="w-full">
          {/* Custom Sleek Tabs Header Row */}
          <TabsList className="bg-card/65 border border-border p-1.5 rounded-full flex gap-1 w-fit shadow-md mb-6">
            <TabsTrigger 
              value="kpi" 
              className="rounded-full px-5 py-2 text-xs font-semibold gap-1.5 transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:font-bold data-[state=active]:shadow-sm"
            >
              <LayoutDashboard className="h-4 w-4 shrink-0" /> 
              KPI Dashboard
            </TabsTrigger>
            <TabsTrigger 
              value="departments" 
              className="rounded-full px-5 py-2 text-xs font-semibold gap-1.5 transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:font-bold data-[state=active]:shadow-sm"
            >
              <BarChart2 className="h-4 w-4 shrink-0" /> 
              Budget Pooling
            </TabsTrigger>
            <TabsTrigger 
              value="seasonal" 
              className="rounded-full px-5 py-2 text-xs font-semibold gap-1.5 transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:font-bold data-[state=active]:shadow-sm"
            >
              <CalendarDays className="h-4 w-4 shrink-0" /> 
              Seasonal Patterns
            </TabsTrigger>
          </TabsList>

          {/* ── KPI Dashboard ── */}
          <TabsContent value="kpi" className="space-y-6 mt-0">
            {kpiDashboard ? (
              <>
                <div className="space-y-3">
                  <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-1">Spend Metrics</h2>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {kpiDashboard.spendKpis.map((m) => <KpiCard key={m.name} metric={m} />)}
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-1">Anomaly & Risk Metrics</h2>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {kpiDashboard.riskKpis.map((m) => <KpiCard key={m.name} metric={m} />)}
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-1">Compliance Safeguards</h2>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {kpiDashboard.complianceKpis.map((m) => <KpiCard key={m.name} metric={m} />)}
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-1">Operational Turnaround</h2>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {kpiDashboard.efficiencyKpis.map((m) => <KpiCard key={m.name} metric={m} />)}
                  </div>
                </div>

                <p className="text-[10px] font-mono text-muted-foreground text-right uppercase font-bold">
                  Dashboard ledger generated: {new Date(kpiDashboard.generatedAt).toLocaleString()}
                </p>
              </>
            ) : (
              <p className="text-xs text-muted-foreground">No KPI data available.</p>
            )}
          </TabsContent>

          {/* ── Department Budget Pool ── */}
          <TabsContent value="departments" className="space-y-6 mt-0">
            {budgetPool ? (
              <>
                {/* Summary Strip */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {[
                    { label: "Pooled Budget", value: `$${budgetPool.totalBudget.toLocaleString()}` },
                    { label: "Aggregate Spend", value: `$${budgetPool.totalSpend.toLocaleString()}` },
                    { label: "Surplus Remaining", value: `$${budgetPool.totalRemaining.toLocaleString()}` },
                    { label: "Total Utilization", value: `${budgetPool.overallUtilizationPercent}%` },
                  ].map((item, i) => (
                    <Card key={item.label} className="rounded-3xl border border-border bg-card/65 shadow-xl backdrop-blur-md overflow-hidden">
                      <CardHeader className="pb-2 bg-muted/20 px-6 py-4 border-b border-border/40">
                        <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{item.label}</CardTitle>
                      </CardHeader>
                      <CardContent className="p-6">
                        <p className="text-2xl font-extrabold text-foreground font-mono">{item.value}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {budgetPool.overBudgetDepartments.length > 0 && (
                  <Alert variant="destructive" className="rounded-2xl border-red-500/25 bg-red-500/[0.02]">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-xs font-semibold text-red-600 dark:text-red-400">
                      Over-budget departments flagged: <strong className="font-mono uppercase">{budgetPool.overBudgetDepartments.join(", ")}</strong>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Department Breakdown Chart */}
                <Card className="rounded-3xl border border-border bg-card/65 shadow-xl backdrop-blur-md overflow-hidden">
                  <CardHeader className="border-b border-border bg-muted/20 px-6 py-4">
                    <CardTitle className="text-base font-bold text-foreground">Department Spend Allocations</CardTitle>
                    <CardDescription className="text-xs text-muted-foreground">Comparison tracking of allocated treasury budgets versus realized spend.</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={budgetPool.departments} layout="vertical" margin={{ left: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis type="number" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 10 }} />
                        <YAxis dataKey="department" type="category" width={100} stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 10 }} />
                        <Tooltip
                          contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px", fontSize: "11px" }}
                          formatter={(value: number) => [`$${value.toLocaleString()}`, ""]}
                        />
                        <Legend wrapperStyle={{ fontSize: "11px" }} />
                        <Bar dataKey="budgetAllocated" name="Treasury Cap" fill="hsl(var(--secondary-foreground)/0.2)" radius={[0, 4, 4, 0]} />
                        <Bar dataKey="totalSpend" name="Realized Spend" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Department Details Roster */}
                <div className="space-y-4">
                  {budgetPool.departments.map((dept) => (
                    <Card key={dept.department} className="rounded-3xl border border-border bg-card/65 shadow-xl backdrop-blur-md overflow-hidden">
                      <CardHeader className="pb-2 bg-muted/10 px-6 py-4 border-b border-border/40">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <CardTitle className="text-sm font-bold text-foreground">{dept.department}</CardTitle>
                          <div className="flex items-center gap-2">
                            <Badge className={`text-[9px] font-bold font-mono tracking-wider px-2 py-0.5 rounded uppercase ${
                              dept.utilizationPercent > 100 ? "bg-red-500/10 text-red-600 border border-red-500/20" : 
                              dept.utilizationPercent > 80 ? "bg-amber-500/10 text-amber-600 border border-amber-500/20" : 
                              "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                            }`}>
                              {dept.utilizationPercent}% of Budget
                            </Badge>
                            <span className="text-[10px] text-muted-foreground font-mono uppercase font-bold">{dept.expenseCount} claims filed</span>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="p-6 space-y-4">
                        <div className="h-1.5 overflow-hidden rounded-full bg-muted border border-border">
                          <div
                            className={`h-full rounded-full transition-all ${dept.utilizationPercent > 100 ? "bg-red-500" : dept.utilizationPercent > 80 ? "bg-amber-500" : "bg-primary"}`}
                            style={{ width: `${Math.min(dept.utilizationPercent, 100)}%` }}
                          />
                        </div>
                        {dept.employees.length > 0 && (
                          <div className="grid gap-2 sm:grid-cols-2">
                            {dept.employees.slice(0, 4).map((emp) => (
                              <div key={emp.email} className="flex items-center justify-between text-xs rounded-xl border border-border bg-secondary/10 px-3 py-2">
                                <span className="truncate text-muted-foreground font-mono text-[10px]">{emp.email}</span>
                                <span className="ml-2 font-bold text-foreground font-mono shrink-0">${emp.totalSpend.toLocaleString()} ({emp.sharePercent}%)</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-xs text-muted-foreground">No budget pool data available.</p>
            )}
          </TabsContent>

          {/* ── Seasonal Adjustments ── */}
          <TabsContent value="seasonal" className="space-y-6 mt-0">
            {seasonal ? (
              <>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {[
                    { label: "Annual Avg Monthly Treasury", value: `$${seasonal.annualAvgMonthlySpend.toLocaleString()}` },
                    { label: "Current Month Index", value: seasonal.currentMonthIndex.toString() },
                    { label: "Estimated Season", value: seasonal.currentSeasonalLabel },
                    { label: "Suggested Monthly Cap", value: `$${seasonal.currentMonthBudgetSuggestion.toLocaleString()}` },
                  ].map((item, i) => (
                    <Card key={item.label} className="rounded-3xl border border-border bg-card/65 shadow-xl backdrop-blur-md overflow-hidden">
                      <CardHeader className="pb-2 bg-muted/20 px-6 py-4 border-b border-border/40">
                        <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{item.label}</CardTitle>
                      </CardHeader>
                      <CardContent className="p-6">
                        <p className="text-xl font-extrabold text-foreground font-mono">{item.value}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <Alert className="rounded-2xl border-primary/20 bg-primary/5 p-4">
                  <AlertDescription className="text-xs text-primary leading-relaxed font-semibold">
                    {seasonal.insight}
                  </AlertDescription>
                </Alert>

                {/* Seasonal Indices Bar Chart */}
                <Card className="rounded-3xl border border-border bg-card/65 shadow-xl backdrop-blur-md overflow-hidden">
                  <CardHeader className="border-b border-border bg-muted/20 px-6 py-4">
                    <CardTitle className="text-base font-bold text-foreground">Monthly Seasonal Spend Indexing</CardTitle>
                    <CardDescription className="text-xs text-muted-foreground">
                      Baseline index of 1.0 represents standard month expectation. Values above 1.0 indicate projected peak demand periods.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={seasonal.monthlyFactors}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 10 }} />
                        <YAxis stroke="hsl(var(--muted-foreground))" domain={[0, "auto"]} tick={{ fontSize: 10 }} />
                        <Tooltip
                          contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px", fontSize: "11px" }}
                          formatter={(value: number, name: string) =>
                            name === "seasonalIndex" ? [value.toFixed(2), "Index Coefficient"] : [`$${Number(value).toLocaleString()}`, "Average Demand"]
                          }
                        />
                        <Legend wrapperStyle={{ fontSize: "11px" }} />
                        <ReferenceLine y={1} stroke="hsl(var(--muted-foreground))" strokeDasharray="4 4" label={{ value: "Baseline Expectation", position: "insideBottomRight", fontSize: 9, fill: "hsl(var(--muted-foreground))" }} />
                        <Bar
                          dataKey="seasonalIndex"
                          name="Demand Index"
                          radius={[4, 4, 0, 0]}
                          fill="hsl(var(--primary))"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Month Breakdown Cards Grid */}
                <Card className="rounded-3xl border border-border bg-card/65 shadow-xl backdrop-blur-md overflow-hidden">
                  <CardHeader className="border-b border-border bg-muted/20 px-6 py-4">
                    <CardTitle className="text-base font-bold text-foreground">Monthly Demand Grid</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      {seasonal.monthlyFactors.map((f) => (
                        <div
                          key={f.month}
                          className="rounded-2xl border border-border bg-secondary/15 p-4 flex items-center justify-between text-xs"
                        >
                          <div>
                            <p className="font-bold text-foreground">{f.month}</p>
                            <p className="text-[10px] text-muted-foreground font-mono mt-0.5">${f.averageSpend.toLocaleString()}/mo avg</p>
                          </div>
                          <Badge
                            className={`text-[9px] font-bold font-mono tracking-wider px-2 py-0.5 rounded uppercase ${
                              f.seasonalLabel === "Peak" ? "bg-red-500/10 text-red-600 border border-red-500/20" : 
                              f.seasonalLabel === "Low" ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20" : 
                              "bg-muted text-muted-foreground border border-border"
                            }`}
                          >
                            Index: {f.seasonalIndex.toFixed(2)}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <p className="text-xs text-muted-foreground">No seasonal data available.</p>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default AdvancedAnalytics;
