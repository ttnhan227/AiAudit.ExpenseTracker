import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { managerService, AuditLog } from "@/services/managerService";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Loader2, AlertCircle } from "lucide-react";

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
    const variants: { [key: string]: "outline" | "secondary" | "destructive" | "default" } = {
      Created: "default",
      Updated: "secondary",
      Submitted: "outline",
      Approved: "default",
      Rejected: "destructive",
      Deleted: "destructive",
    };
    return <Badge variant={variants[action] || "outline"}>{action}</Badge>;
  };

  const getActionColor = (action: string): string => {
    switch (action) {
      case "Created":
        return "text-primary";
      case "Updated":
        return "text-secondary-foreground";
      case "Submitted":
        return "text-sky-500";
      case "Approved":
        return "text-green-500";
      case "Rejected":
        return "text-destructive";
      default:
        return "text-muted-foreground";
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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/manager/pending")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Audit Trail</h1>
            <p className="text-muted-foreground">Expense ID: {id}</p>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Timeline */}
        {logs.length === 0 ? (
          <Card className="border-border/50">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">No audit logs available</p>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>Activity History</CardTitle>
              <CardDescription>{logs.length} events recorded</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {logs.map((log, index) => (
                  <div key={log.id}>
                    {(() => {
                      const oldValue = parseAuditPayload(log.oldValue);
                      const newValue = parseAuditPayload(log.newValue);

                      return (
                    <div className="flex gap-4">
                      {/* Timeline dot and line */}
                      <div className="flex flex-col items-center">
                        <div className={`h-10 w-10 rounded-full border-2 border-border flex items-center justify-center ${getActionColor(log.action)} bg-background`}>
                          <div className="h-3 w-3 rounded-full bg-current" />
                        </div>
                        {index !== logs.length - 1 && (
                          <div className="h-12 w-0.5 bg-border/50 my-2" />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 pt-1">
                        <div className="flex items-center gap-2 mb-1">
                          {getActionBadge(log.action)}
                          <span className="text-sm text-muted-foreground">
                            by {log.performedBy}
                          </span>
                        </div>

                        <p className="text-sm text-muted-foreground">
                          {formatDate(log.timestamp)}
                        </p>

                        {log.notes && (
                          <p className="text-sm mt-2 p-2 rounded bg-secondary/30 text-foreground">
                            <strong>Notes:</strong> {log.notes}
                          </p>
                        )}

                        {/* Changes */}
                        {oldValue && newValue && (
                          <div className="mt-3 space-y-2 text-sm">
                            {Object.keys(newValue).map((key) => {
                              const oldVal = oldValue[key];
                              const newVal = newValue[key];
                              if (oldVal === newVal) return null;

                              return (
                                <div key={key} className="flex gap-2">
                                  <span className="font-medium text-foreground capitalize">
                                    {key}:
                                  </span>
                                  <div className="space-x-2">
                                    <span className="line-through text-muted-foreground">
                                      {typeof oldVal === "object"
                                        ? JSON.stringify(oldVal)
                                        : String(oldVal)}
                                    </span>
                                    <span>→</span>
                                    <span className="font-medium text-foreground">
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

                    {index !== logs.length - 1 && <Separator className="my-6" />}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <div className="flex gap-2">
          <Button onClick={() => navigate("/manager/pending")}>Back to Pending</Button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AuditTrail;
