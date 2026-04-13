import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { expenseService, Expense } from "@/services/expenseService";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Loader2, AlertTriangle, CheckCircle, AlertCircle } from "lucide-react";

const ExpenseDetail = () => {
  const { user } = useAuth();
  const canUseSubmitterFeatures = user?.role === "Admin" || user?.role === "User";
  const { id } = useParams();
  const navigate = useNavigate();
  const [expense, setExpense] = useState<Expense | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchExpense = async () => {
      if (!id) return;
      const result = await expenseService.getById(id);
      if (result.success && result.data) {
        setExpense(result.data);
      } else {
        setError(result.error || "Failed to fetch expense");
      }
      setIsLoading(false);
    };

    fetchExpense();
  }, [id]);

  const handleSubmit = async () => {
    if (!expense) return;
    setIsSubmitting(true);
    const result = await expenseService.submit(expense.id);
    if (result.success) {
      setExpense(result.data || null);
    } else {
      setError(result.error || "Failed to submit expense");
    }
    setIsSubmitting(false);
  };

  const formatCurrency = (amount: number, currency: string = "USD") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case "High":
        return "destructive";
      case "Medium":
        return "secondary";
      case "Low":
        return "outline";
      default:
        return "outline";
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: { [key: string]: "outline" | "secondary" | "destructive" | "default" } = {
      Draft: "outline",
      Pending: "secondary",
      Approved: "default",
      Rejected: "destructive",
    };
    return <Badge variant={variants[status] || "outline"}>{status}</Badge>;
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

  if (!expense) {
    return (
      <DashboardLayout>
        <div className="space-y-4">
          <Button variant="ghost" onClick={() => navigate("/expenses")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Expenses
          </Button>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error || "Expense not found"}</AlertDescription>
          </Alert>
        </div>
      </DashboardLayout>
    );
  }

  const riskAssessment = expense.riskAssessment;
  const reviewAssistant = expense.reviewAssistant;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/expenses")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-foreground">Expense Detail</h1>
            <p className="text-muted-foreground">{expense.merchant}</p>
          </div>
          <div>{getStatusBadge(expense.status)}</div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Main Info */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column - Expense Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info Card */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle>Expense Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Amount</p>
                    <p className="text-2xl font-bold text-foreground">
                      {formatCurrency(expense.amount, expense.currency)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Merchant</p>
                    <p className="text-lg font-semibold text-foreground">{expense.merchant}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Category</p>
                    <p className="text-lg font-semibold text-foreground">{expense.category}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Date</p>
                    <p className="text-lg font-semibold text-foreground">
                      {formatDate(expense.date)}
                    </p>
                  </div>
                </div>

                {expense.description && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Description</p>
                      <p className="text-foreground">{expense.description}</p>
                    </div>
                  </>
                )}

                {expense.flagged && (
                  <>
                    <Separator />
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Flagged:</strong> {expense.flagReason}
                      </AlertDescription>
                    </Alert>
                  </>
                )}

                {/* Timestamps */}
                <Separator />
                <div className="grid gap-4 md:grid-cols-2 text-sm text-muted-foreground">
                  <div>
                    <p>Created: {formatDate(expense.createdAt)}</p>
                  </div>
                  {expense.updatedAt && (
                    <div>
                      <p>Updated: {formatDate(expense.updatedAt)}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Risk Assessment Card */}
            {riskAssessment && (
              <Card className={`border-border/50 ${riskAssessment.riskLevel === "High" ? "bg-destructive/5" : riskAssessment.riskLevel === "Medium" ? "bg-secondary/5" : ""}`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Risk Assessment</CardTitle>
                    <Badge variant={getRiskLevelColor(riskAssessment.riskLevel)}>
                      {riskAssessment.riskLevel} - {riskAssessment.riskScore}%
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {riskAssessment.policyTriggers.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold capitalize mb-2">Triggered Rules:</p>
                      <div className="flex flex-wrap gap-2">
                        {riskAssessment.policyTriggers.map((trigger, idx) => (
                          <Badge key={idx} variant="destructive" className="whitespace-normal text-left">
                            {trigger}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {riskAssessment.riskReasons.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold capitalize mb-2">Risk Reasons:</p>
                      <ul className="space-y-1 text-sm">
                        {riskAssessment.riskReasons.map((reason, idx) => (
                          <li key={idx} className="flex gap-2">
                            <span className="text-primary">•</span>
                            <span>{reason}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Review Assistant Card */}
            {reviewAssistant && (
              <Card className="border-border/50 bg-primary/5">
                <CardHeader>
                  <CardTitle>Review Insights</CardTitle>
                  <CardDescription>AI-powered analysis and recommendations</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {reviewAssistant.recommendation && (
                    <div>
                      <p className="text-sm font-semibold mb-1">Recommendation</p>
                      <p className="text-sm">{reviewAssistant.recommendation}</p>
                    </div>
                  )}

                  {reviewAssistant.summary && (
                    <div>
                      <p className="text-sm font-semibold mb-1">Summary</p>
                      <p className="text-sm">{reviewAssistant.summary}</p>
                    </div>
                  )}

                  {reviewAssistant.missingEvidence && reviewAssistant.missingEvidence.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold mb-2">Missing Evidence</p>
                      <ul className="space-y-1 text-sm">
                        {reviewAssistant.missingEvidence.map((item, idx) => (
                          <li key={idx} className="flex gap-2">
                            <span className="text-destructive">•</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {reviewAssistant.suspiciousPatterns && reviewAssistant.suspiciousPatterns.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold mb-2">Suspicious Patterns</p>
                      <ul className="space-y-1 text-sm">
                        {reviewAssistant.suspiciousPatterns.map((pattern, idx) => (
                          <li key={idx} className="flex gap-2">
                            <span className="text-secondary-foreground">•</span>
                            <span>{pattern}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {reviewAssistant.reviewerPrompts && reviewAssistant.reviewerPrompts.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold mb-2">Reviewer Checklist</p>
                      <ul className="space-y-1 text-sm">
                        {reviewAssistant.reviewerPrompts.slice(0, 3).map((prompt, idx) => (
                          <li key={idx} className="flex gap-2">
                            <span className="text-primary">•</span>
                            <span>{prompt}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Actions */}
          <div className="space-y-4">
            <Card className="border-border/50 sticky top-4">
              <CardHeader>
                <CardTitle className="text-lg">Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {expense.status === "Draft" && canUseSubmitterFeatures && (
                  <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="w-full"
                  >
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isSubmitting ? "Submitting..." : "Submit for Review"}
                  </Button>
                )}

                {expense.status === "Pending" && (
                  <div className="rounded-lg bg-secondary/20 p-3 text-sm text-foreground">
                    <p className="font-semibold mb-1">Waiting for Review</p>
                    <p className="text-xs text-muted-foreground">
                      Your expense has been submitted and is awaiting manager approval.
                    </p>
                  </div>
                )}

                {expense.status === "Approved" && (
                  <div className="rounded-lg bg-primary/20 p-3 text-sm text-foreground flex gap-2">
                    <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                    <div>
                      <p className="font-semibold">Approved</p>
                      <p className="text-xs text-muted-foreground">This expense has been approved.</p>
                    </div>
                  </div>
                )}

                {expense.status === "Rejected" && (
                  <div className="rounded-lg bg-destructive/20 p-3 text-sm text-destructive">
                    <p className="font-semibold mb-1">Rejected</p>
                    <p className="text-xs">{expense.flagReason}</p>
                  </div>
                )}

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate("/expenses")}
                >
                  Back to List
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ExpenseDetail;
