import React, { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, AlertCircle, ShieldCheck, Download, Trash2, UserSearch, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { complianceService, SoxAuditTrail, Soc2ComplianceReport, GdprUserDataExport, GdprDeletionResult } from "@/services/analyticsService";

// ── SOX ─────────────────────────────────────────────────────────────────────────

const SoxPanel = () => {
  const [trail, setTrail] = useState<SoxAuditTrail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const fetchTrail = async () => {
    setIsLoading(true);
    setError("");
    const result = await complianceService.getSoxAuditTrail(from || undefined, to || undefined);
    if (result.success && result.data) {
      setTrail(result.data);
    } else {
      setError(result.error || "Failed to load SOX audit trail");
    }
    setIsLoading(false);
  };

  const downloadJson = () => {
    if (!trail) return;
    const blob = new Blob([JSON.stringify(trail, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sox-audit-trail-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <Card className="rounded-3xl border border-border bg-card/65 shadow-xl backdrop-blur-md overflow-hidden">
        <CardHeader className="border-b border-border bg-muted/20 px-6 py-4">
          <CardTitle className="flex items-center gap-2 text-base font-bold text-foreground">
            <ShieldCheck className="h-5 w-5 text-primary" />
            SOX Audit Trail
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Tamper-evident, hash-chained audit log. Each entry has a SHA-256 integrity hash for forensic validation.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="space-y-1">
              <Label htmlFor="sox-from" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">From Date</Label>
              <Input id="sox-from" type="datetime-local" value={from} onChange={(e) => setFrom(e.target.value)} className="w-52 bg-card border-border text-foreground text-xs rounded-xl focus:ring-primary/20 h-10 font-mono" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="sox-to" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">To Date</Label>
              <Input id="sox-to" type="datetime-local" value={to} onChange={(e) => setTo(e.target.value)} className="w-52 bg-card border-border text-foreground text-xs rounded-xl focus:ring-primary/20 h-10 font-mono" />
            </div>
            <div className="flex items-end gap-2 flex-wrap">
              <Button onClick={fetchTrail} disabled={isLoading} className="rounded-full px-6 bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-md h-10 text-xs gap-2">
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                Load SOX Log
              </Button>
              {trail && (
                <Button variant="outline" onClick={downloadJson} className="rounded-full px-6 border-border hover:bg-muted text-foreground font-medium h-10 text-xs gap-2">
                  <Download className="h-4 w-4" />
                  Export JSON
                </Button>
              )}
            </div>
          </div>

          {error && (
            <Alert variant="destructive" className="rounded-xl">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs font-semibold">{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {trail && (
        <Card className="rounded-3xl border border-border bg-card/65 shadow-xl backdrop-blur-md overflow-hidden">
          <CardHeader className="border-b border-border bg-muted/20 px-6 py-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <CardTitle className="text-base font-bold text-foreground">{trail.totalCount} Immutable Entries</CardTitle>
                <CardDescription className="mt-1 font-mono text-[10px] break-all max-w-md text-muted-foreground">
                  Export Chain Hash: {trail.exportHash}
                </CardDescription>
              </div>
              <Badge variant="outline" className="font-mono text-xs uppercase px-2 py-0.5 rounded-lg border-border">{new Date(trail.exportedAt).toLocaleString()}</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {trail.entries.map((entry) => (
                <div key={entry.id} className="rounded-2xl border border-border bg-secondary/20 p-4 text-xs">
                  <div className="flex items-center justify-between gap-2 flex-wrap mb-2">
                    <div className="flex items-center gap-2">
                      <Badge className={`text-[9px] font-bold font-mono tracking-wider px-2 py-0.5 rounded uppercase ${
                        entry.action === "Approved" ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20" :
                        entry.action === "Rejected" ? "bg-red-500/10 text-red-600 border border-red-500/20" :
                        "bg-muted text-muted-foreground border border-border"
                      }`}>
                        {entry.action}
                      </Badge>
                      <span className="font-semibold text-foreground">{entry.performedBy}</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {new Date(entry.timestamp).toLocaleString()}
                    </span>
                  </div>
                  {entry.notes && <p className="text-muted-foreground leading-relaxed bg-card p-2.5 rounded-xl border border-border">{entry.notes}</p>}
                  <p className="mt-2 font-mono text-[9px] text-muted-foreground/60 break-all bg-card/40 px-2 py-1 border border-border/40 rounded">
                    Integrity Block Chain Signature SHA-256: {entry.integrityHash}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// ── GDPR ─────────────────────────────────────────────────────────────────────────

const GdprPanel = () => {
  const [userId, setUserId] = useState("");
  const [exportData, setExportData] = useState<GdprUserDataExport | null>(null);
  const [deletionResult, setDeletionResult] = useState<GdprDeletionResult | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const handleExport = async () => {
    if (!userId.trim()) return;
    setIsExporting(true);
    setError("");
    setExportData(null);
    const result = await complianceService.exportUserData(userId.trim());
    if (result.success && result.data) {
      setExportData(result.data);
    } else {
      setError(result.error || "Failed to export user data");
    }
    setIsExporting(false);
  };

  const downloadExport = () => {
    if (!exportData) return;
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `gdpr-export-${exportData.userId}-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDelete = async () => {
    if (!userId.trim() || !deleteConfirm) return;
    setIsDeleting(true);
    setError("");
    const result = await complianceService.deleteUserData(userId.trim());
    if (result.success && result.data) {
      setDeletionResult(result.data);
      setExportData(null);
    } else {
      setError(result.error || "Failed to delete user data");
    }
    setIsDeleting(false);
    setDeleteConfirm(false);
  };

  return (
    <div className="space-y-4">
      <Card className="rounded-3xl border border-border bg-card/65 shadow-xl backdrop-blur-md overflow-hidden">
        <CardHeader className="border-b border-border bg-muted/20 px-6 py-4">
          <CardTitle className="flex items-center gap-2 text-base font-bold text-foreground">
            <UserSearch className="h-5 w-5 text-primary" />
            GDPR User Request Panel
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Right of access (Art. 15) — export all personal data. Right to erasure (Art. 17) — anonymize PII.
            Audit logs are retained as required by regulatory obligations.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1 flex-1 min-w-48">
              <Label htmlFor="gdpr-userid" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">User GUID ID</Label>
              <Input
                id="gdpr-userid"
                placeholder="e.g. 3fa85f64-5717-4562-b3fc-2c963f66afa6"
                value={userId}
                onChange={(e) => { setUserId(e.target.value); setDeleteConfirm(false); setDeletionResult(null); }}
                className="font-mono text-xs bg-card border-border text-foreground rounded-xl focus:ring-primary/20 h-10"
              />
            </div>
            <Button onClick={handleExport} disabled={isExporting || !userId.trim()} className="rounded-full px-6 bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-md h-10 text-xs gap-2">
              {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              Fetch GDPR Log
            </Button>
          </div>

          {error && (
            <Alert variant="destructive" className="rounded-xl">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs font-semibold">{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {exportData && (
        <Card className="rounded-3xl border border-border bg-card/65 shadow-xl backdrop-blur-md overflow-hidden">
          <CardHeader className="border-b border-border bg-muted/20 px-6 py-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <CardTitle className="text-base font-bold text-foreground">{exportData.email}</CardTitle>
                <CardDescription className="text-xs text-muted-foreground mt-0.5">
                  Role: <span className="uppercase text-primary font-bold font-mono">{exportData.role}</span> · {exportData.expenses.length} expenses · {exportData.auditActions.length} audit actions
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={downloadExport} className="rounded-full px-4 text-xs font-semibold border-border hover:bg-muted text-foreground h-9 gap-1.5">
                  <Download className="h-4 w-4" />
                  Download JSON
                </Button>
                {!deleteConfirm ? (
                  <Button variant="destructive" onClick={() => setDeleteConfirm(true)} className="rounded-full px-4 text-xs font-bold bg-destructive/10 text-destructive border border-destructive/25 hover:bg-destructive hover:text-destructive-foreground h-9 gap-1.5">
                    <Trash2 className="h-4 w-4" />
                    Request Erasure
                  </Button>
                ) : (
                  <div className="flex items-center gap-2 rounded-2xl border border-destructive/30 bg-destructive/5 px-3 py-1 text-xs">
                    <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
                    <span className="font-bold text-destructive">Confirm Erasure?</span>
                    <Button size="sm" variant="destructive" onClick={handleDelete} disabled={isDeleting} className="rounded-full px-3 text-[10px] font-bold h-7 gap-1">
                      {isDeleting ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                      Erase PII
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setDeleteConfirm(false)} className="rounded-full px-3 text-[10px] font-semibold h-7">Cancel</Button>
                  </div>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid gap-2 sm:grid-cols-2 text-xs bg-muted/20 border border-border/40 p-4 rounded-2xl">
              <div><span className="text-muted-foreground uppercase font-bold tracking-wider text-[9px]">Filer ID:</span> <span className="font-mono text-foreground">{exportData.userId}</span></div>
              <div><span className="text-muted-foreground uppercase font-bold tracking-wider text-[9px]">Active Status:</span> <span className="font-semibold">{exportData.isActive ? "Active Account" : "Suspended"}</span></div>
              <div><span className="text-muted-foreground uppercase font-bold tracking-wider text-[9px]">Workspace Currency:</span> <span className="font-semibold font-mono">{exportData.preferredCurrency}</span></div>
              <div><span className="text-muted-foreground uppercase font-bold tracking-wider text-[9px]">Export Generation:</span> <span className="font-semibold font-mono">{new Date(exportData.exportedAt).toLocaleString()}</span></div>
            </div>
          </CardContent>
        </Card>
      )}

      {deletionResult && (
        <Alert className="border-emerald-200 bg-emerald-500/10 rounded-2xl p-4">
          <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          <AlertDescription className="text-xs text-emerald-800 dark:text-emerald-300 font-semibold leading-relaxed">
            <strong>Erasure completed successfully:</strong> {deletionResult.message}<br />
            {deletionResult.expensesAnonymized} claim records successfully anonymized · {deletionResult.auditLogsRetained} regulatory ledger audit logs preserved.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

// ── SOC2 ─────────────────────────────────────────────────────────────────────────

const Soc2Panel = () => {
  const [report, setReport] = useState<Soc2ComplianceReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchReport = async () => {
    setIsLoading(true);
    setError("");
    const result = await complianceService.getSoc2Report();
    if (result.success && result.data) {
      setReport(result.data);
    } else {
      setError(result.error || "Failed to load SOC2 report");
    }
    setIsLoading(false);
  };

  useEffect(() => { fetchReport(); }, []);

  const statusVariant = (status: string) => {
    if (status === "PASS") return "default";
    if (status === "FAIL") return "destructive";
    return "secondary";
  };

  const StatusIcon = ({ status }: { status: string }) => {
    if (status === "PASS") return <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />;
    if (status === "FAIL") return <XCircle className="h-4 w-4 text-red-500 shrink-0" />;
    return <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />;
  };

  const categories = report ? [...new Set(report.controls.map((c) => c.category))] : [];

  return (
    <div className="space-y-4 text-xs">
      {error && (
        <Alert variant="destructive" className="rounded-xl">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-xs font-semibold">{error}</AlertDescription>
        </Alert>
      )}

      {isLoading && (
        <div className="flex h-48 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {report && (
        <>
          {/* Score Summary */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Compliance Score", value: `${report.complianceScore}%` },
              { label: "Controls Passing", value: String(report.passingCount) },
              { label: "Controls Warning", value: String(report.warningCount) },
              { label: "Controls Failing", value: String(report.failingCount) },
            ].map((item, i) => (
              <Card key={item.label} className={`rounded-3xl border border-border bg-card/65 shadow-xl backdrop-blur-md overflow-hidden ${i === 3 && report.failingCount > 0 ? "border-red-500/20 bg-red-500/[0.02]" : ""}`}>
                <CardHeader className="pb-2 bg-muted/20 px-6 py-4 border-b border-border/40">
                  <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{item.label}</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <p className={`text-2xl font-extrabold font-mono ${i === 3 && report.failingCount > 0 ? "text-red-500" : "text-foreground"}`}>{item.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex items-center gap-3 bg-card/65 border border-border p-3 rounded-2xl shadow-md flex-wrap">
            <Badge className={`text-[10px] font-bold font-mono tracking-wider px-2 py-0.5 rounded uppercase ${
              report.overallStatus === "COMPLIANT" ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20" : 
              report.overallStatus === "PARTIAL" ? "bg-amber-500/10 text-amber-600 border border-amber-500/20" : 
              "bg-red-500/10 text-red-600 border border-red-500/20"
            }`}>
              Status: {report.overallStatus}
            </Badge>
            <span className="text-[10px] font-mono text-muted-foreground uppercase font-bold">
              Ledger generated: {new Date(report.generatedAt).toLocaleString()}
            </span>
            <Button variant="outline" size="sm" onClick={fetchReport} className="ml-auto rounded-full px-4 border-border text-[10px] font-bold h-7 gap-1">
              <Loader2 className={`h-3 w-3 ${isLoading ? "animate-spin" : "hidden"}`} />
              Refresh Controls
            </Button>
          </div>

          {/* Controls by category */}
          {categories.map((cat) => (
            <Card key={cat} className="rounded-3xl border border-border bg-card/65 shadow-xl backdrop-blur-md overflow-hidden">
              <CardHeader className="border-b border-border bg-muted/20 px-6 py-4">
                <CardTitle className="text-base font-bold text-foreground">{cat}</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-3">
                {report.controls.filter((c) => c.category === cat).map((control) => (
                  <div key={control.controlId} className="flex items-start gap-3 rounded-2xl border border-border bg-secondary/15 p-4 text-xs">
                    <StatusIcon status={control.status} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
                        <p className="font-bold text-foreground text-sm">{control.controlId} — {control.description}</p>
                        <Badge className={`text-[9px] font-bold font-mono tracking-wider px-2 py-0.5 rounded uppercase ${
                          control.status === "PASS" ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20" :
                          control.status === "FAIL" ? "bg-red-500/10 text-red-600 border border-red-500/20" :
                          "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                        }`}>
                          {control.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed bg-card p-2.5 rounded-xl border border-border mt-2 font-mono">{control.evidence}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </>
      )}
    </div>
  );
};

// ── Main Page ──────────────────────────────────────────────────────────────────

const ComplianceHub = () => (
  <DashboardLayout>
    <div className="space-y-6 font-sans">
      
      {/* Header Ribbon */}
      <div className="flex items-center gap-4 rounded-3xl border border-border bg-card/65 p-6 shadow-xl backdrop-blur-md">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 text-primary">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <div className="flex-1">
          <span className="text-[10px] font-mono tracking-[0.28em] text-primary bg-primary/5 px-2 py-0.5 border border-primary/10 rounded uppercase">
            Regulatory Portal
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight mt-1.5">Compliance Hub</h1>
          <p className="text-sm text-muted-foreground font-sans">
            SOX tamper-evident audit trails, GDPR user right-to-erasure tools, and live SOC2 control reports.
          </p>
        </div>
      </div>

      <Tabs defaultValue="soc2" className="w-full">
        {/* Sleek inline filter style for TabsList */}
        <TabsList className="bg-card/65 border border-border p-1.5 rounded-full flex gap-1 w-fit shadow-md mb-6">
          <TabsTrigger 
            value="soc2" 
            className="rounded-full px-5 py-2 text-xs font-semibold gap-1.5 transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:font-bold data-[state=active]:shadow-sm"
          >
            <ShieldCheck className="h-4 w-4 shrink-0" /> 
            SOC2 Audit Report
          </TabsTrigger>
          <TabsTrigger 
            value="sox" 
            className="rounded-full px-5 py-2 text-xs font-semibold gap-1.5 transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:font-bold data-[state=active]:shadow-sm"
          >
            <ShieldCheck className="h-4 w-4 shrink-0" /> 
            SOX Ledger Chain
          </TabsTrigger>
          <TabsTrigger 
            value="gdpr" 
            className="rounded-full px-5 py-2 text-xs font-semibold gap-1.5 transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:font-bold data-[state=active]:shadow-sm"
          >
            <UserSearch className="h-4 w-4 shrink-0" /> 
            GDPR Erasure
          </TabsTrigger>
        </TabsList>

        <TabsContent value="soc2" className="mt-0"><Soc2Panel /></TabsContent>
        <TabsContent value="sox" className="mt-0"><SoxPanel /></TabsContent>
        <TabsContent value="gdpr" className="mt-0"><GdprPanel /></TabsContent>
      </Tabs>
    </div>
  </DashboardLayout>
);

export default ComplianceHub;
