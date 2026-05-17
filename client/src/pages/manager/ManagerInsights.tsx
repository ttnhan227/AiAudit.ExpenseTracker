import React, { useEffect, useState } from "react";
import { managerService, AuditInsight } from "@/services/managerService";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, AlertCircle, ShieldCheck, TimerReset, ShieldAlert, Download, AlertTriangle, ArrowUpRight, Sparkles } from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const ManagerInsights = () => {
  const [insights, setInsights] = useState<AuditInsight | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [periodMonths, setPeriodMonths] = useState("6");
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchInsights = async () => {
      const result = await managerService.getAuditInsights();
      if (result.success && result.data) {
        setInsights(result.data);
      } else {
        setError(result.error || "Failed to load manager insights");
      }
      setIsLoading(false);
    };

    fetchInsights();
  }, []);

  const downloadBlob = (blob: Blob, fileName: string) => {
    const blobUrl = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = blobUrl;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(blobUrl);
  };

  const handleExportCsv = async () => {
    try {
      setIsExporting(true);
      const blob = await managerService.exportExpenses();
      downloadBlob(blob, `tenant-expenses-${new Date().toISOString().slice(0, 10)}.csv`);
    } catch {
      setError("Failed to export CSV.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleAccountingExport = async (format: "quickbooks" | "xero") => {
    try {
      setIsExporting(true);
      const blob = format === "quickbooks"
        ? await managerService.exportQuickBooks()
        : await managerService.exportXero();
      downloadBlob(blob, `${format}-export-${new Date().toISOString().slice(0, 10)}.csv`);
    } catch {
      setError(`Failed to export ${format === "quickbooks" ? "QuickBooks" : "Xero"} file.`);
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex h-96 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!insights) {
    return (
      <DashboardLayout>
        <div className="space-y-6 font-sans">
          
          {/* Header Ribbon */}
          <div className="flex items-center gap-4 rounded-3xl border border-border bg-card/65 p-6 shadow-xl backdrop-blur-md">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 text-primary">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <span className="text-[10px] font-mono tracking-[0.28em] text-primary bg-primary/5 px-2 py-0.5 border border-primary/10 rounded uppercase">
                Audit Intelligence
              </span>
              <h1 className="text-3xl font-extrabold tracking-tight mt-1.5">Manager Insights</h1>
              <p className="text-sm text-muted-foreground font-sans">
                Spend analytics, policy recommendation forecasts, and AI neural net training rates.
              </p>
            </div>
          </div>

          <Alert variant="destructive" className="rounded-xl">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs font-semibold">{error || "No insight data available."}</AlertDescription>
          </Alert>
        </div>
      </DashboardLayout>
    );
  }

  const monthWindow = Number(periodMonths);
  const filteredRiskTrend = insights.monthlyHighRiskTrend.slice(-monthWindow);
  const filteredPolicyTriggerTrend = insights.monthlyPolicyTriggerTrend.slice(-monthWindow);
  const mergedTrendData = filteredRiskTrend.map((riskPoint, index) => ({
    ...riskPoint,
    triggeredCount: filteredPolicyTriggerTrend[index]?.triggeredCount ?? 0,
  }));
  const windowTotals = mergedTrendData.reduce(
    (acc, point) => {
      acc.highRisk += point.highRiskCount;
      acc.reviewed += point.reviewedCount;
      acc.triggers += point.triggeredCount;
      return acc;
    },
    { highRisk: 0, reviewed: 0, triggers: 0 }
  );
  const maxPolicyTriggerCount = Math.max(...insights.topPolicyTriggers.map((item) => item.count), 1);

  return (
    <DashboardLayout>
      <div className="space-y-6 font-sans">
        
        {/* Header Ribbon */}
        <div className="flex items-center gap-4 rounded-3xl border border-border bg-card/65 p-6 shadow-xl backdrop-blur-md">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 text-primary">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <span className="text-[10px] font-mono tracking-[0.28em] text-primary bg-primary/5 px-2 py-0.5 border border-primary/10 rounded uppercase">
              Audit Intelligence
            </span>
            <h1 className="text-3xl font-extrabold tracking-tight mt-1.5">Manager Insights</h1>
            <p className="text-sm text-muted-foreground font-sans">
              Spend analytics, policy recommendation forecasts, and AI neural net training rates.
            </p>
          </div>
        </div>

        {/* Global actions bar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-card/65 border border-border p-4 rounded-3xl shadow-md">
          <div className="space-y-0.5">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Analysis Scope</p>
            <Select value={periodMonths} onValueChange={setPeriodMonths}>
              <SelectTrigger className="w-full sm:w-48 bg-card border-border text-foreground text-xs rounded-xl focus:ring-primary/20 h-9 font-mono mt-1">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent className="bg-popover border border-border text-xs text-popover-foreground">
                <SelectItem value="1">Last 1 month</SelectItem>
                <SelectItem value="3">Last 3 months</SelectItem>
                <SelectItem value="6">Last 6 months</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 pt-1.5 sm:pt-0">
            <Button onClick={handleExportCsv} disabled={isExporting} className="rounded-full px-4 text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground h-9 shadow-sm gap-1.5">
              {isExporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
              Export CSV
            </Button>
            <Button onClick={() => handleAccountingExport("quickbooks")} disabled={isExporting} variant="outline" className="rounded-full px-4 text-xs font-medium border-border hover:bg-muted text-foreground h-9 gap-1.5">
              <Download className="h-3.5 w-3.5" />
              QuickBooks
            </Button>
            <Button onClick={() => handleAccountingExport("xero")} disabled={isExporting} variant="outline" className="rounded-full px-4 text-xs font-medium border-border hover:bg-muted text-foreground h-9 gap-1.5">
              <Download className="h-3.5 w-3.5" />
              Xero
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="rounded-xl">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs font-semibold">{error}</AlertDescription>
          </Alert>
        )}

        {/* First Row Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="rounded-3xl border border-border bg-card/65 shadow-xl backdrop-blur-md overflow-hidden">
            <CardHeader className="pb-2 bg-muted/20 px-6 py-4 border-b border-border/40">
              <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Claims Approved</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <p className="text-2xl font-extrabold text-foreground font-mono">{insights.approvedCount}</p>
              <p className="text-xs text-muted-foreground mt-1">Successfully cleared transactions</p>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border border-border bg-card/65 shadow-xl backdrop-blur-md overflow-hidden">
            <CardHeader className="pb-2 bg-muted/20 px-6 py-4 border-b border-border/40">
              <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Claims Rejected</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <p className="text-2xl font-extrabold text-red-500 font-mono">{insights.rejectedCount}</p>
              <p className="text-xs text-muted-foreground mt-1">Declined policy violations</p>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border border-border bg-card/65 shadow-xl backdrop-blur-md overflow-hidden">
            <CardHeader className="pb-2 bg-muted/20 px-6 py-4 border-b border-border/40 flex items-center justify-between">
              <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Flagged Documents</CardTitle>
              <ShieldAlert className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent className="p-6">
              <p className="text-2xl font-extrabold text-foreground font-mono">{insights.flaggedCount}</p>
              <p className="text-xs text-muted-foreground mt-1">High severity: <span className="text-red-500 font-bold">{insights.highRiskCount}</span></p>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border border-border bg-card/65 shadow-xl backdrop-blur-md overflow-hidden">
            <CardHeader className="pb-2 bg-muted/20 px-6 py-4 border-b border-border/40 flex items-center justify-between">
              <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Decision Velocity</CardTitle>
              <TimerReset className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent className="p-6">
              <p className="text-2xl font-extrabold text-foreground font-mono">{insights.turnaround.averageDecisionHours}h</p>
              <p className="text-xs text-muted-foreground mt-1">Avg approval: {insights.turnaround.averageApprovalHours}h</p>
            </CardContent>
          </Card>
        </div>

        {/* Second Row KPIs */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="rounded-3xl border border-border bg-card/65 shadow-xl backdrop-blur-md overflow-hidden">
            <CardHeader className="pb-2 bg-muted/20 px-6 py-4 border-b border-border/40 flex items-center justify-between">
              <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">SLA Violation Rate</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent className="p-6">
              <p className="text-2xl font-extrabold text-foreground font-mono">{insights.operationalKpis.slaBreachRate}%</p>
              <p className="text-xs text-muted-foreground mt-1">
                {insights.operationalKpis.slaBreachedDecisions}/{insights.operationalKpis.totalDecisions} claims over 48h SLA
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border border-border bg-card/65 shadow-xl backdrop-blur-md overflow-hidden">
            <CardHeader className="pb-2 bg-muted/20 px-6 py-4 border-b border-border/40 flex items-center justify-between">
              <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">AI Escalation Rate</CardTitle>
              <ArrowUpRight className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent className="p-6">
              <p className="text-2xl font-extrabold text-foreground font-mono">{insights.operationalKpis.escalationRate}%</p>
              <p className="text-xs text-muted-foreground mt-1">{insights.operationalKpis.escalationCount} claims routed to senior managers</p>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border border-border bg-card/65 shadow-xl backdrop-blur-md overflow-hidden">
            <CardHeader className="pb-2 bg-muted/20 px-6 py-4 border-b border-border/40">
              <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Window Metrics</CardTitle>
            </CardHeader>
            <CardContent className="p-6 text-xs text-foreground space-y-1 font-semibold">
              <p>Total High Risk: <span className="font-bold font-mono text-red-500">{windowTotals.highRisk}</span></p>
              <p>Total Reviewed: <span className="font-bold font-mono text-primary">{windowTotals.reviewed}</span></p>
              <p>Total Violations: <span className="font-bold font-mono text-amber-500">{windowTotals.triggers}</span></p>
            </CardContent>
          </Card>
        </div>

        {/* Third Row Feedback/Confidence metrics */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="rounded-3xl border border-border bg-card/65 shadow-xl backdrop-blur-md overflow-hidden">
            <CardHeader className="pb-2 bg-muted/20 px-6 py-4 border-b border-border/40 flex items-center justify-between">
              <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">AI Confidence score</CardTitle>
              <Sparkles className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent className="p-6">
              <p className="text-2xl font-extrabold text-primary font-mono">{insights.learningMetrics.currentConfidenceScore}%</p>
              <p className="text-xs text-muted-foreground mt-1">
                {insights.learningMetrics.confidenceTrendPercentage >= 0 ? "+" : ""}
                {insights.learningMetrics.confidenceTrendPercentage}% trend this month
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border border-border bg-card/65 shadow-xl backdrop-blur-md overflow-hidden">
            <CardHeader className="pb-2 bg-muted/20 px-6 py-4 border-b border-border/40">
              <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Model Corrections</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <p className="text-2xl font-extrabold text-foreground font-mono">{insights.learningMetrics.feedbackCount}</p>
              <p className="text-xs text-muted-foreground mt-1">{insights.learningMetrics.falsePositiveCount} false positive override logs</p>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border border-border bg-card/65 shadow-xl backdrop-blur-md overflow-hidden">
            <CardHeader className="pb-2 bg-muted/20 px-6 py-4 border-b border-border/40">
              <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Auto-Approval Noise</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <p className="text-2xl font-extrabold text-red-500 font-mono">{insights.learningMetrics.autoApprovalFalsePositiveCount}</p>
              <p className="text-xs text-muted-foreground mt-1">{insights.learningMetrics.falsePositiveRate}% model false positive release</p>
            </CardContent>
          </Card>
        </div>

        {/* Fourth Row Recommendations */}
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="rounded-3xl border border-border bg-card/65 shadow-xl backdrop-blur-md overflow-hidden">
            <CardHeader className="border-b border-border bg-muted/20 px-6 py-4">
              <CardTitle className="text-base font-bold text-foreground">AI Policy Optimization</CardTitle>
              <CardDescription className="text-xs text-muted-foreground">Savings recommendations derived from policy benchmarks.</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-3">
                {insights.policyRecommendations.map((item) => (
                  <div key={item.title} className="rounded-2xl border border-border bg-secondary/20 p-4 text-xs">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-bold text-foreground">{item.title}</p>
                        <p className="mt-1 text-muted-foreground leading-relaxed">{item.recommendation}</p>
                      </div>
                      <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold font-mono rounded-lg">
                        +${Math.round(item.estimatedSavings)}
                      </Badge>
                    </div>
                    <p className="mt-2 text-[10px] text-primary font-mono">{item.benchmark}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border border-border bg-card/65 shadow-xl backdrop-blur-md overflow-hidden">
            <CardHeader className="border-b border-border bg-muted/20 px-6 py-4">
              <CardTitle className="text-base font-bold text-foreground">Filer Behavior Triggers</CardTitle>
              <CardDescription className="text-xs text-muted-foreground">Recurring high risk behaviors causing review bottleneck.</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {insights.employeeBehaviorInsights.length === 0 ? (
                <p className="text-xs text-muted-foreground py-4">No behavioral anomalies flagged yet.</p>
              ) : (
                <div className="space-y-3">
                  {insights.employeeBehaviorInsights.map((item) => (
                    <div key={`${item.employeeEmail}-${item.insight}`} className="rounded-2xl border border-border bg-secondary/20 p-4 text-xs">
                      <p className="font-bold text-foreground break-all font-mono">{item.employeeEmail}</p>
                      <p className="mt-1 text-muted-foreground leading-relaxed">{item.insight}</p>
                      <p className="mt-2 text-[10px] text-primary font-bold">{item.nudge}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="rounded-3xl border border-border bg-card/65 shadow-xl backdrop-blur-md overflow-hidden">
            <CardHeader className="border-b border-border bg-muted/20 px-6 py-4">
              <CardTitle className="text-base font-bold text-foreground">Violations vs Risk Level</CardTitle>
              <CardDescription className="text-xs text-muted-foreground">Historical trend showing risky claims against general triggers.</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={mergedTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="monthLabel" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 10 }} />
                  <YAxis stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px", fontSize: "12px" }} />
                  <Legend wrapperStyle={{ fontSize: "11px" }} />
                  <Line type="monotone" dataKey="highRiskCount" name="High Risk Rating" stroke="hsl(var(--destructive))" strokeWidth={2} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="triggeredCount" name="Rule Breaches" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border border-border bg-card/65 shadow-xl backdrop-blur-md overflow-hidden">
            <CardHeader className="border-b border-border bg-muted/20 px-6 py-4">
              <CardTitle className="text-base font-bold text-foreground">Top Rejection Reasons</CardTitle>
              <CardDescription className="text-xs text-muted-foreground">Most common refusal logs noted by managers.</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {insights.topRejectionReasons.length === 0 ? (
                <p className="text-xs text-muted-foreground py-8 text-center font-mono uppercase">No Rejection History</p>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={insights.topRejectionReasons} layout="vertical" margin={{ left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" allowDecimals={false} stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 10 }} />
                    <YAxis dataKey="reason" type="category" width={100} stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px", fontSize: "12px" }} />
                    <Bar dataKey="count" fill="hsl(var(--destructive))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Final Row triggers */}
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="rounded-3xl border border-border bg-card/65 shadow-xl backdrop-blur-md overflow-hidden lg:col-span-2">
            <CardHeader className="border-b border-border bg-muted/20 px-6 py-4 flex items-center justify-between">
              <CardTitle className="text-base font-bold text-foreground">Trigger Frequency Leaderboard</CardTitle>
              <ShieldCheck className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent className="p-6">
              {insights.topPolicyTriggers.length === 0 ? (
                <p className="text-xs text-muted-foreground">No triggers recorded yet.</p>
              ) : (
                <div className="space-y-4">
                  {insights.topPolicyTriggers.slice(0, 4).map((item) => (
                    <div key={item.trigger} className="space-y-1 text-xs">
                      <div className="flex items-center justify-between font-semibold">
                        <span className="text-foreground">{item.trigger}</span>
                        <Badge variant="outline" className="font-mono text-[10px]">{item.count} hits</Badge>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted border border-border">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${Math.max((item.count / maxPolicyTriggerCount) * 100, 6)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-3xl border border-border bg-card/65 shadow-xl backdrop-blur-md overflow-hidden">
            <CardHeader className="border-b border-border bg-muted/20 px-6 py-4">
              <CardTitle className="text-base font-bold text-foreground">Frequent Infraction Filer</CardTitle>
              <CardDescription className="text-xs text-muted-foreground">Top employee emails flagged.</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {insights.highestFlagRateEmployees.length === 0 ? (
                <p className="text-xs text-muted-foreground font-mono">No data logged.</p>
              ) : (
                <div className="space-y-3">
                  {insights.highestFlagRateEmployees.slice(0, 3).map((employee) => (
                    <div key={employee.employeeEmail} className="rounded-2xl border border-border bg-secondary/20 p-3 text-xs">
                      <p className="font-bold text-foreground break-all font-mono">{employee.employeeEmail}</p>
                      <p className="text-muted-foreground mt-1 font-mono text-[10px]">
                        {employee.flaggedCount}/{employee.expenseCount} flagged ({employee.flagRate}%)
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ManagerInsights;
