import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { managerService, PendingExpense, AuditLog } from "@/services/managerService";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertCircle, CheckCircle, XCircle, Loader2, Eye, FileText, History } from "lucide-react";

const ALL_RISKS = "all-risks";
const ALL_RECOMMENDATIONS = "all-recommendations";

const ManagerPending = () => {
  const [expenses, setExpenses] = useState<PendingExpense[]>([]);
  const [filteredExpenses, setFilteredExpenses] = useState<PendingExpense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [riskFilter, setRiskFilter] = useState(ALL_RISKS);
  const [recommendationFilter, setRecommendationFilter] = useState(ALL_RECOMMENDATIONS);
  const [selectedExpense, setSelectedExpense] = useState<PendingExpense | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [actionInProgress, setActionInProgress] = useState("");
  const [reviewDrawerOpen, setReviewDrawerOpen] = useState(false);
  const [drawerExpense, setDrawerExpense] = useState<PendingExpense | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isLoadingAudit, setIsLoadingAudit] = useState(false);

  useEffect(() => {
    const fetchPending = async () => {
      const result = await managerService.getPendingExpenses();
      if (result.success && result.data) {
        setExpenses(result.data);
        setFilteredExpenses(result.data);
      } else {
        setError(result.error || "Failed to fetch pending expenses");
      }
      setIsLoading(false);
    };

    fetchPending();
  }, []);

  useEffect(() => {
    let filtered = [...expenses];

    if (riskFilter !== ALL_RISKS) {
      filtered = filtered.filter((expense) => expense.riskAssessment.riskLevel === riskFilter);
    }

    if (recommendationFilter !== ALL_RECOMMENDATIONS) {
      filtered = filtered.filter((expense) => expense.reviewAssistant.recommendation === recommendationFilter);
    }

    filtered.sort((a, b) => b.riskAssessment.riskScore - a.riskAssessment.riskScore || a.reviewPriority - b.reviewPriority);
    setFilteredExpenses(filtered);
  }, [expenses, riskFilter, recommendationFilter]);

  const handleApprove = async (expenseId: string) => {
    setActionInProgress(expenseId);
    const result = await managerService.approve(expenseId);
    if (result.success) {
      setExpenses((prev) => prev.filter((e) => e.id !== expenseId));
    } else {
      setError(result.error || "Failed to approve expense");
    }
    setActionInProgress("");
  };

  const handleReject = async () => {
    if (!selectedExpense || !rejectReason.trim()) {
      setError("Please enter a rejection reason");
      return;
    }

    setActionInProgress(selectedExpense.id);
    const result = await managerService.reject(selectedExpense.id, {
      reason: rejectReason,
    });
    if (result.success) {
      setExpenses((prev) => prev.filter((e) => e.id !== selectedExpense.id));
      setShowRejectDialog(false);
      setSelectedExpense(null);
      setRejectReason("");
    } else {
      setError(result.error || "Failed to reject expense");
    }
    setActionInProgress("");
  };

  const getRiskBadge = (level: string) => {
    const variants: { [key: string]: "outline" | "secondary" | "destructive" | "default" } = {
      High: "destructive",
      Medium: "secondary",
      Low: "outline",
    };
    return <Badge variant={variants[level] || "outline"}>{level}</Badge>;
  };

  const formatCurrency = (amount: number, currency: string = "USD") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US");
  };

  const highRiskCount = filteredExpenses.filter((expense) => expense.riskAssessment.riskLevel === "High").length;
  const escalateCount = filteredExpenses.filter((expense) => expense.reviewAssistant.recommendation === "Escalate").length;

  const openReviewDrawer = async (expense: PendingExpense) => {
    setDrawerExpense(expense);
    setReviewDrawerOpen(true);
    setAuditLogs([]);
    setIsLoadingAudit(true);
    const result = await managerService.getAuditTrail(expense.id);
    if (result.success && result.data) {
      setAuditLogs(result.data);
    }
    setIsLoadingAudit(false);
  };

  const recommendationVariant = (rec: string): "outline" | "secondary" | "destructive" | "default" => {
    if (rec === "Escalate") return "destructive";
    if (rec === "Needs review") return "secondary";
    return "default";
  };

  const isPreviewableImage = (url: string) => {
    const normalized = url.toLowerCase();
    return normalized.startsWith("data:image/") || /\.(png|jpe?g|gif|webp|bmp|svg)(\?|$)/i.test(normalized);
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
        <div>
          <h1 className="text-3xl font-bold text-foreground">Pending Expenses</h1>
          <p className="text-muted-foreground">Risk-ranked queue with policy evidence and AI review guidance</p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Queue Size</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{filteredExpenses.length}</p>
              <p className="text-xs text-muted-foreground">Claims awaiting manager decision</p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">High Risk First</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-destructive">{highRiskCount}</p>
              <p className="text-xs text-muted-foreground">Claims with elevated score</p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Escalation Suggested</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{escalateCount}</p>
              <p className="text-xs text-muted-foreground">AI suggests deeper review</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Select value={riskFilter} onValueChange={setRiskFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by risk" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_RISKS}>All risk levels</SelectItem>
              <SelectItem value="Low">Low</SelectItem>
              <SelectItem value="Medium">Medium</SelectItem>
              <SelectItem value="High">High</SelectItem>
            </SelectContent>
          </Select>

          <Select value={recommendationFilter} onValueChange={setRecommendationFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by recommendation" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_RECOMMENDATIONS}>All recommendations</SelectItem>
              <SelectItem value="Approve with normal review">Approve with normal review</SelectItem>
              <SelectItem value="Needs review">Needs review</SelectItem>
              <SelectItem value="Escalate">Escalate</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Pending Review</CardTitle>
            <CardDescription>
              {filteredExpenses.length === 0
                ? "No pending expenses"
                : `${filteredExpenses.length} expense(s) awaiting approval`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredExpenses.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <CheckCircle className="h-12 w-12 text-primary/50 mb-4" />
                <p className="text-muted-foreground mb-4">All expenses have been reviewed!</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Priority</TableHead>
                      <TableHead>Employee</TableHead>
                      <TableHead>Merchant</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Risk Level</TableHead>
                      <TableHead>Signals</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredExpenses.map((expense) => (
                      <TableRow key={expense.id} className={expense.riskAssessment.riskLevel === "High" ? "bg-destructive/5" : ""}>
                        <TableCell>
                          <Badge variant="outline">#{expense.reviewPriority}</Badge>
                        </TableCell>
                        <TableCell className="font-medium text-sm">
                          {expense.employeeEmail}
                        </TableCell>
                        <TableCell>
                          <p className="font-medium">{expense.merchant}</p>
                          <p className="text-xs text-muted-foreground">{expense.category} · {formatDate(expense.date)}</p>
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(expense.amount, expense.currency)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getRiskBadge(expense.riskAssessment.riskLevel)}
                            <span className="text-xs text-muted-foreground">
                              {expense.riskAssessment.riskScore}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <p className="text-xs font-medium">{expense.reviewAssistant.recommendation}</p>
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {expense.riskAssessment.riskReasons[0] || "No clear signals"}
                            </p>
                            {expense.triggeredRuleCount > 0 && (
                              <Badge variant="secondary" className="text-[10px]">
                                {expense.triggeredRuleCount} policy rule(s)
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Button
                              variant="outline"
                              size="sm"
                              title="Review details"
                              onClick={() => openReviewDrawer(expense)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleApprove(expense.id)}
                              disabled={actionInProgress === expense.id}
                              title="Approve"
                            >
                              {actionInProgress === expense.id && (
                                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                              )}
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => {
                                setSelectedExpense(expense);
                                setShowRejectDialog(true);
                              }}
                              disabled={actionInProgress === expense.id}
                              title="Reject"
                            >
                              {actionInProgress === expense.id && (
                                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                              )}
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Reject Dialog */}
        <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reject Expense</DialogTitle>
              <DialogDescription>
                Please provide a reason for rejecting this expense.
              </DialogDescription>
            </DialogHeader>

            {selectedExpense && (
              <div className="space-y-4">
                <div className="p-3 rounded-lg bg-secondary/30 text-sm">
                  <p>
                    <strong>{selectedExpense.merchant}</strong> - {formatCurrency(selectedExpense.amount, selectedExpense.currency)}
                  </p>
                  <p className="text-xs text-muted-foreground">{selectedExpense.employeeEmail}</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Rejection Reason</label>
                  <Textarea
                    placeholder="Enter the reason for rejection..."
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    rows={4}
                  />
                </div>

                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowRejectDialog(false);
                      setRejectReason("");
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleReject}
                    disabled={!rejectReason.trim()}
                  >
                    Reject Expense
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Review Drawer */}
        <Sheet open={reviewDrawerOpen} onOpenChange={setReviewDrawerOpen}>
          <SheetContent side="right" className="w-full sm:max-w-2xl overflow-hidden flex flex-col p-0">
            {drawerExpense && (
              <>
                <SheetHeader className="px-6 pt-6 pb-4 border-b border-border/50">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <SheetTitle className="text-xl">{drawerExpense.merchant}</SheetTitle>
                      <p className="text-sm text-muted-foreground mt-0.5">{drawerExpense.employeeEmail} · {drawerExpense.category}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {getRiskBadge(drawerExpense.riskAssessment.riskLevel)}
                      <span className="text-sm text-muted-foreground">{drawerExpense.riskAssessment.riskScore}%</span>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3 flex-wrap">
                    <Badge variant={recommendationVariant(drawerExpense.reviewAssistant.recommendation)}>
                      {drawerExpense.reviewAssistant.recommendation}
                    </Badge>
                    <Badge variant="outline">
                      Confidence: {drawerExpense.reviewAssistant.confidence}
                    </Badge>
                    <Badge variant="outline">
                      #{drawerExpense.reviewPriority} in queue
                    </Badge>
                  </div>
                </SheetHeader>

                <ScrollArea className="flex-1 px-6">
                  <div className="space-y-6 py-6">
                    {/* Summary */}
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">AI Review Summary</p>
                      <p className="text-sm leading-relaxed">{drawerExpense.reviewAssistant.summary}</p>
                    </div>

                    <Separator />

                    {/* Amount + date */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Amount</p>
                        <p className="font-semibold text-lg">{formatCurrency(drawerExpense.amount, drawerExpense.currency)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Date</p>
                        <p className="font-medium">{formatDate(drawerExpense.date)}</p>
                      </div>
                      {drawerExpense.description && (
                        <div className="col-span-2">
                          <p className="text-muted-foreground">Description</p>
                          <p className="font-medium">{drawerExpense.description}</p>
                        </div>
                      )}
                    </div>

                    {/* Policy triggers */}
                    {drawerExpense.riskAssessment.policyTriggers.length > 0 && (
                      <>
                        <Separator />
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wider text-destructive mb-2">Policy Violations</p>
                          <div className="flex flex-wrap gap-2">
                            {drawerExpense.riskAssessment.policyTriggers.map((trigger, idx) => (
                              <Badge key={idx} variant="destructive" className="whitespace-normal text-left">
                                {trigger}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </>
                    )}

                    {/* Risk reasons */}
                    {drawerExpense.riskAssessment.riskReasons.length > 0 && (
                      <>
                        <Separator />
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Risk Signals</p>
                          <ul className="space-y-1.5 text-sm">
                            {drawerExpense.riskAssessment.riskReasons.map((reason, idx) => (
                              <li key={idx} className="flex gap-2">
                                <span className="text-primary mt-0.5">•</span>
                                <span>{reason}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </>
                    )}

                    {/* Missing evidence */}
                    {drawerExpense.reviewAssistant.missingEvidence.length > 0 && (
                      <>
                        <Separator />
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Missing Evidence</p>
                          <ul className="space-y-1.5 text-sm">
                            {drawerExpense.reviewAssistant.missingEvidence.map((item, idx) => (
                              <li key={idx} className="flex gap-2">
                                <span className="text-destructive mt-0.5">•</span>
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </>
                    )}

                    {/* Suspicious patterns */}
                    {drawerExpense.reviewAssistant.suspiciousPatterns.length > 0 && (
                      <>
                        <Separator />
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Suspicious Patterns</p>
                          <ul className="space-y-1.5 text-sm">
                            {drawerExpense.reviewAssistant.suspiciousPatterns.map((pattern, idx) => (
                              <li key={idx} className="flex gap-2">
                                <span className="text-secondary-foreground mt-0.5">⚠</span>
                                <span>{pattern}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </>
                    )}

                    {/* Reviewer checklist */}
                    {drawerExpense.reviewAssistant.reviewerPrompts.length > 0 && (
                      <>
                        <Separator />
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Reviewer Checklist</p>
                          <ul className="space-y-1.5 text-sm">
                            {drawerExpense.reviewAssistant.reviewerPrompts.map((prompt, idx) => (
                              <li key={idx} className="flex gap-2">
                                <span className="text-primary mt-0.5">☐</span>
                                <span>{prompt}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </>
                    )}

                    {/* Related expenses */}
                    {drawerExpense.reviewAssistant.relatedExpenses.length > 0 && (
                      <>
                        <Separator />
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Related Claims ({drawerExpense.reviewAssistant.relatedExpenses.length})</p>
                          <div className="space-y-2">
                            {drawerExpense.reviewAssistant.relatedExpenses.map((related) => (
                              <div key={related.id} className="flex items-center justify-between rounded-lg border border-border/50 bg-secondary/20 px-3 py-2 text-sm">
                                <div>
                                  <p className="font-medium">{related.merchant}</p>
                                  <p className="text-xs text-muted-foreground">{related.employeeEmail} · {related.relationship}</p>
                                </div>
                                <div className="text-right">
                                  <p className="font-medium">{formatCurrency(related.amount, related.currency)}</p>
                                  <Badge variant="outline" className="text-[10px]">{related.status}</Badge>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    )}

                    {/* Receipts */}
                    {drawerExpense.receiptUrls.length > 0 && (
                      <>
                        <Separator />
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Receipts ({drawerExpense.receiptUrls.length})</p>
                          <div className="grid gap-3 sm:grid-cols-2">
                            {drawerExpense.receiptUrls.map((url, idx) => (
                              <div key={idx} className="rounded-lg border border-border/50 bg-secondary/20 p-2">
                                {isPreviewableImage(url) ? (
                                  <img
                                    src={url}
                                    alt={`Receipt ${idx + 1}`}
                                    className="h-40 w-full rounded-md object-cover"
                                  />
                                ) : (
                                  <div className="flex h-40 items-center justify-center rounded-md border border-dashed border-border/60 text-xs text-muted-foreground">
                                    Preview not available
                                  </div>
                                )}
                                <a
                                  href={url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="mt-2 block truncate text-sm text-primary hover:underline"
                                >
                                  Open receipt {idx + 1}
                                </a>
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    )}

                    {/* Audit trail */}
                    <Separator />
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Recent Activity</p>
                      {isLoadingAudit ? (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          Loading history…
                        </div>
                      ) : auditLogs.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No history recorded yet.</p>
                      ) : (
                        <div className="space-y-2">
                          {auditLogs.slice(-5).reverse().map((log) => (
                            <div key={log.id} className="flex gap-3 text-sm">
                              <Badge variant="outline" className="text-[10px] flex-shrink-0">{log.action}</Badge>
                              <div>
                                <p className="text-muted-foreground">{log.performedBy} · {new Date(log.timestamp).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
                                {log.notes && <p className="text-xs mt-0.5">{log.notes}</p>}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </ScrollArea>

                {/* Drawer footer actions */}
                <div className="border-t border-border/50 px-6 py-4 flex flex-wrap gap-2">
                  <Button
                    variant="default"
                    size="sm"
                    disabled={actionInProgress === drawerExpense.id}
                    onClick={async () => {
                      await handleApprove(drawerExpense.id);
                      setReviewDrawerOpen(false);
                    }}
                  >
                    {actionInProgress === drawerExpense.id && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
                    <CheckCircle className="mr-1 h-4 w-4" />
                    Approve
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={actionInProgress === drawerExpense.id}
                    onClick={() => {
                      setSelectedExpense(drawerExpense);
                      setReviewDrawerOpen(false);
                      setShowRejectDialog(true);
                    }}
                  >
                    <XCircle className="mr-1 h-4 w-4" />
                    Reject
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link to={`/expenses/${drawerExpense.id}`}>
                      <FileText className="mr-1 h-4 w-4" />
                      Full Detail
                    </Link>
                  </Button>
                  <Button variant="ghost" size="sm" asChild>
                    <Link to={`/manager/audit/${drawerExpense.id}`}>
                      <History className="mr-1 h-4 w-4" />
                      Full Audit Trail
                    </Link>
                  </Button>
                </div>
              </>
            )}
          </SheetContent>
        </Sheet>
      </div>
    </DashboardLayout>
  );
};

export default ManagerPending;
