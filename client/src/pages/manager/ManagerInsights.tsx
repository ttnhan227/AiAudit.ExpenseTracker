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
import { Loader2, AlertCircle, ShieldCheck, TimerReset, ShieldAlert, Download, AlertTriangle, ArrowUpRight } from "lucide-react";
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

  const handleExportCsv = async () => {
    try {
      setIsExporting(true);
      const blob = await managerService.exportExpenses();
      const blobUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = blobUrl;
      anchor.download = `tenant-expenses-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(blobUrl);
    } catch {
      setError("Failed to export CSV.");
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
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Manager Insights</h1>
            <p className="text-muted-foreground">Operational analytics for review quality, policy violations, and decision speed.</p>
          </div>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error || "No insight data available."}</AlertDescription>
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
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Manager Insights</h1>
            <p className="text-muted-foreground">Audit intelligence and policy analytics for spend governance.</p>
          </div>
          <div className="flex w-full gap-3 lg:w-auto">
            <Select value={periodMonths} onValueChange={setPeriodMonths}>
              <SelectTrigger className="w-full lg:w-48">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Last 1 month</SelectItem>
                <SelectItem value="3">Last 3 months</SelectItem>
                <SelectItem value="6">Last 6 months</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleExportCsv} disabled={isExporting} className="gap-2">
              {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              Export CSV
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card className="border-border/60">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Approved</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{insights.approvedCount}</p>
            </CardContent>
          </Card>
          <Card className="border-border/60">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Rejected</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-destructive">{insights.rejectedCount}</p>
            </CardContent>
          </Card>
          <Card className="border-border/60">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm">Flagged Claims</CardTitle>
              <ShieldAlert className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{insights.flaggedCount}</p>
              <p className="text-xs text-muted-foreground">High risk: {insights.highRiskCount}</p>
            </CardContent>
          </Card>
          <Card className="border-border/60">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm">Decision Speed</CardTitle>
              <TimerReset className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{insights.turnaround.averageDecisionHours}h</p>
              <p className="text-xs text-muted-foreground">Approve avg: {insights.turnaround.averageApprovalHours}h</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <Card className="border-border/60">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm">SLA Breach Rate</CardTitle>
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{insights.operationalKpis.slaBreachRate}%</p>
              <p className="text-xs text-muted-foreground">
                {insights.operationalKpis.slaBreachedDecisions}/{insights.operationalKpis.totalDecisions} decisions over 48h
              </p>
            </CardContent>
          </Card>
          <Card className="border-border/60">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm">Escalation Rate</CardTitle>
              <ArrowUpRight className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{insights.operationalKpis.escalationRate}%</p>
              <p className="text-xs text-muted-foreground">{insights.operationalKpis.escalationCount} claims recommended for escalation</p>
            </CardContent>
          </Card>
          <Card className="border-border/60">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Selected Period Totals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1 text-sm">
                <p>High Risk: <span className="font-semibold">{windowTotals.highRisk}</span></p>
                <p>Reviewed: <span className="font-semibold">{windowTotals.reviewed}</span></p>
                <p>Policy Triggers: <span className="font-semibold">{windowTotals.triggers}</span></p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle>Monthly Risk vs Policy Triggers</CardTitle>
              <CardDescription>How risky claims and policy violations trend over selected period</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={mergedTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="monthLabel" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 11 }} />
                  <YAxis stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                  <Legend />
                  <Line type="monotone" dataKey="highRiskCount" name="High Risk" stroke="hsl(var(--destructive))" strokeWidth={2} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="triggeredCount" name="Policy Triggers" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardHeader>
              <CardTitle>Top Rejection Reasons</CardTitle>
              <CardDescription>Most common reasons managers reject claims</CardDescription>
            </CardHeader>
            <CardContent>
              {insights.topRejectionReasons.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">No rejection reason history yet.</p>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={insights.topRejectionReasons} layout="vertical" margin={{ left: 30 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" allowDecimals={false} stroke="hsl(var(--muted-foreground))" />
                    <YAxis dataKey="reason" type="category" width={140} stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                    <Bar dataKey="count" fill="hsl(var(--destructive))" radius={[0, 8, 8, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="border-border/60 lg:col-span-2">
            <CardHeader>
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" />
                <CardTitle>Top Policy Triggers</CardTitle>
              </div>
              <CardDescription>Most frequently triggered policy conditions</CardDescription>
            </CardHeader>
            <CardContent>
              {insights.topPolicyTriggers.length === 0 ? (
                <p className="text-sm text-muted-foreground">No policy triggers detected yet.</p>
              ) : (
                <div className="space-y-3">
                  {insights.topPolicyTriggers.map((item) => (
                    <div key={item.trigger}>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className="font-medium">{item.trigger}</span>
                        <Badge variant="outline">{item.count}</Badge>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-secondary/50">
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

          <Card className="border-border/60">
            <CardHeader>
              <CardTitle>Top Flag-Rate Employees</CardTitle>
              <CardDescription>Employees with highest flagged ratio</CardDescription>
            </CardHeader>
            <CardContent>
              {insights.highestFlagRateEmployees.length === 0 ? (
                <p className="text-sm text-muted-foreground">No employee data.</p>
              ) : (
                <div className="space-y-3">
                  {insights.highestFlagRateEmployees.map((employee) => (
                    <div key={employee.employeeEmail} className="rounded-lg border border-border/50 p-3">
                      <p className="text-sm font-medium break-all">{employee.employeeEmail}</p>
                      <p className="text-xs text-muted-foreground mt-1">
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
