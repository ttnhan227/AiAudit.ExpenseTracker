import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { managerService, AuditLog } from "@/services/managerService";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Loader2, AlertCircle, Sparkles } from "lucide-react";

const parseAuditPayload = (value?: string) => {
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as Record<string, unknown>;
  } catch {
    return null;
  }
};

const AuditTrail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAuditTrail = async () => {
      if (!id) return;
      const result = await managerService.getAuditTrail(id);
      if (result.success && result.data) {
        setLogs(result.data);
      } else {
        setError(result.error || "Failed to fetch audit trail");
      }
      setIsLoading(false);
    };

    fetchAuditTrail();
  }, [id]);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const getActionBadge = (action: string) => {
    if (action === "Approved") {
      return (
        <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[9px] font-bold py-0.5 rounded font-mono uppercase tracking-wider">
          Approved
        </Badge>
      );
    }
    if (action === "Rejected" || action === "Deleted") {
      return (
        <Badge className="bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 text-[9px] font-bold py-0.5 rounded font-mono uppercase tracking-wider">
          {action}
        </Badge>
      );
    }
    return (
      <Badge className="bg-primary/10 text-primary border border-primary/20 text-[9px] font-bold py-0.5 rounded font-mono uppercase tracking-wider">
        {action}
      </Badge>
    );
  };

  const getActionColor = (action: string): string => {
    switch (action) {
      case "Created":
        return "text-primary border-primary/30";
      case "Updated":
        return "text-amber-500 border-amber-500/30";
      case "Submitted":
        return "text-sky-500 border-sky-500/30";
      case "Approved":
        return "text-emerald-500 border-emerald-500/30";
      case "Rejected":
      case "Deleted":
        return "text-red-500 border-red-500/30";
      default:
        return "text-muted-foreground border-border";
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

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl font-sans">
        
        {/* Header Ribbon */}
        <div className="flex items-center gap-4 rounded-3xl border border-border bg-card/65 p-6 shadow-xl backdrop-blur-md">
          <Button variant="ghost" size="icon" onClick={() => navigate("/manager/pending")} className="h-10 w-10 rounded-full border border-border bg-card/50 hover:bg-muted text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <span className="text-[10px] font-mono tracking-[0.28em] text-primary bg-primary/5 px-2 py-0.5 border border-primary/10 rounded uppercase">
              Forensic Log
            </span>
            <h1 className="text-3xl font-extrabold tracking-tight mt-1.5">Audit Trail</h1>
            <p className="text-xs text-muted-foreground font-sans">
              Chain-of-custody immutable timeline for Expense Claim <span className="font-mono text-[10px] font-bold text-foreground bg-secondary/60 px-1.5 py-0.5 rounded border border-border">{id}</span>
            </p>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="rounded-xl">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs font-semibold">{error}</AlertDescription>
          </Alert>
        )}

        {/* Timeline */}
        {logs.length === 0 ? (
          <Card className="rounded-3xl border border-border bg-card/65 shadow-xl backdrop-blur-md overflow-hidden">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <AlertCircle className="h-12 w-12 text-muted-foreground/35 mb-4" />
              <p className="text-sm font-bold text-foreground">No Trail Logs Available</p>
              <p className="text-xs text-muted-foreground mt-1">This expense has not triggered audit lifecycle states.</p>
            </CardContent>
          </Card>
        ) : (
          <Card className="rounded-3xl border border-border bg-card/65 shadow-xl backdrop-blur-md overflow-hidden">
            <CardHeader className="border-b border-border bg-muted/20 px-6 py-4">
              <CardTitle className="text-base font-bold text-foreground">Activity History</CardTitle>
              <CardDescription className="text-xs text-muted-foreground">{logs.length} immutable events recorded in ledger.</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-6">
                {logs.map((log, index) => (
                  <div key={log.id}>
                    {(() => {
                      const oldValue = parseAuditPayload(log.oldValue);
                      const newValue = parseAuditPayload(log.newValue);

                      return (
                        <div className="flex gap-4 items-start text-xs leading-normal">
                          {/* Timeline dot and line */}
                          <div className="flex flex-col items-center flex-shrink-0">
                            <div className={`h-8 w-8 rounded-full border-2 flex items-center justify-center ${getActionColor(log.action)} bg-card shadow-sm`}>
                              <div className="h-2 w-2 rounded-full bg-current" />
                            </div>
                            {index !== logs.length - 1 && (
                              <div className="h-12 w-0.5 bg-border/60 my-1" />
                            )}
                          </div>

                          {/* Content */}
                          <div className="flex-1 pt-0.5">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              {getActionBadge(log.action)}
                              <span className="font-bold text-foreground">
                                {log.performedBy}
                              </span>
                            </div>

                            <p className="text-[10px] text-muted-foreground font-mono">
                              {formatDate(log.timestamp)}
                            </p>

                            {log.notes && (
                              <p className="text-xs mt-2 p-3 rounded-2xl bg-secondary/30 border border-border text-foreground leading-relaxed">
                                <strong className="text-primary mr-1">Notes:</strong> {log.notes}
                              </p>
                            )}

                            {/* Changes details */}
                            {oldValue && newValue && (
                              <div className="mt-3 space-y-2 text-xs border border-border/40 p-3 rounded-2xl bg-muted/20 font-mono">
                                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1">
                                  <Sparkles className="h-3 w-3 text-primary" />
                                  Ledger Diff Check
                                </p>
                                {Object.keys(newValue).map((key) => {
                                  const oldVal = oldValue[key];
                                  const newVal = newValue[key];
                                  if (oldVal === newVal) return null;

                                  return (
                                    <div key={key} className="flex gap-2 flex-wrap items-center">
                                      <span className="font-bold text-foreground capitalize">
                                        {key}:
                                      </span>
                                      <div className="space-x-1.5">
                                        <span className="line-through text-muted-foreground bg-red-500/5 px-1 rounded border border-red-500/10">
                                          {typeof oldVal === "object"
                                            ? JSON.stringify(oldVal)
                                            : String(oldVal)}
                                        </span>
                                        <span className="text-muted-foreground">→</span>
                                        <span className="font-bold text-foreground bg-emerald-500/5 px-1 rounded border border-emerald-500/10">
                                          {typeof newVal === "object"
                                            ? JSON.stringify(newVal)
                                            : String(newVal)}
                                        </span>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })()}

                    {index !== logs.length - 1 && <Separator className="my-6 border-border/40" />}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Back navigation */}
        <div className="flex gap-2">
          <Button onClick={() => navigate("/manager/pending")} className="rounded-full px-5 text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground h-9 shadow-md">Back to Pending Queue</Button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AuditTrail;
