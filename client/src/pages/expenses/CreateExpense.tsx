import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { expenseService, ExpenseCreateRequest } from "@/services/expenseService";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2, ArrowLeft, ShieldAlert } from "lucide-react";

const CATEGORIES = [
  "Travel",
  "Meals",
  "Accommodation",
  "Office Supplies",
  "Software",
  "Alcohol",
  "Other",
];

const CreateExpense = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    amount: "",
    currency: "USD",
    merchant: "",
    category: "",
    date: new Date().toISOString().split("T")[0],
    description: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = (): boolean => {
    setError("");

    if (!formData.amount) {
      setError("Amount is required");
      return false;
    }

    if (isNaN(parseFloat(formData.amount)) || parseFloat(formData.amount) <= 0) {
      setError("Amount must be a positive number");
      return false;
    }

    if (!formData.merchant.trim()) {
      setError("Merchant is required");
      return false;
    }

    if (!formData.category) {
      setError("Category is required");
      return false;
    }

    if (!formData.date) {
      setError("Date is required");
      return false;
    }

    return true;
  };

  const previewSignals = (() => {
    const amount = parseFloat(formData.amount || "0");
    const signals: string[] = [];

    if (amount >= 2_000_000 && formData.currency === "VND") {
      signals.push("VND amount exceeds 2,000,000. Will require manager signature.");
    } else if (amount >= 100 && formData.currency === "USD") {
      signals.push("USD amount exceeds $100. Will require manager signature.");
    }

    if (formData.category.toLowerCase().includes("alcohol")) {
      signals.push("Restricted category (Alcohol) triggers strict policy compliance check.");
    }

    if (!formData.description.trim()) {
      signals.push("Please add a business purpose description to speed up review approvals.");
    }

    return signals;
  })();

  const handleSubmit = async (e: React.FormEvent, saveDraft: boolean = false) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const request: ExpenseCreateRequest = {
        amount: parseFloat(formData.amount),
        currency: formData.currency,
        merchant: formData.merchant,
        category: formData.category,
        date: formData.date,
        description: formData.description || undefined,
      };

      const result = await expenseService.create(request);

      if (result.success && result.data) {
        if (!saveDraft) {
          const submitResult = await expenseService.submit(result.data.id);
          if (submitResult.success) {
            navigate(`/expenses/${result.data.id}`);
            return;
          }
        }
        navigate(`/expenses/${result.data.id}`);
      } else {
        setError(result.error || "Failed to create expense");
      }
    } catch (err) {
      setError("An error occurred while creating the expense");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 font-sans">
        {/* Header Ribbon - matches list & dashboard */}
        <div className="flex items-center gap-4 rounded-3xl border border-border bg-card/65 p-6 shadow-xl backdrop-blur-md">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/expenses")}
            className="rounded-full hover:bg-muted text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <span className="text-[10px] font-mono tracking-[0.28em] text-primary bg-primary/5 px-2 py-0.5 border border-primary/10 rounded uppercase">
              Capture Claims
            </span>
            <h1 className="text-3xl font-extrabold tracking-tight mt-1.5">New Expense</h1>
            <p className="text-sm text-muted-foreground">Add a new expense log and submit it to review channels.</p>
          </div>
        </div>

        {/* Side-by-side Live Guides */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="rounded-3xl border border-border bg-card/65 shadow-xl backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-foreground">Compliance Guardrails</CardTitle>
              <CardDescription className="text-xs text-muted-foreground">Company spend policies and limits</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-xs text-muted-foreground">
              <p>• Meal and accommodation records above $100 (or 2M VND) trigger manager oversight.</p>
              <p>• Alcohol claims are flagged automatically for rigorous justification.</p>
              <p>• Adding high-resolution receipts and descriptions speeds up approval times by 85%.</p>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border border-border bg-secondary/20 shadow-xl backdrop-blur-md">
            <CardHeader className="flex flex-row items-center gap-2 space-y-0">
              <ShieldAlert className="h-4.5 w-4.5 text-primary" />
              <div>
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-foreground">Real-Time Policy Check</CardTitle>
                <CardDescription className="text-xs text-muted-foreground">Live guidance as you type</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              {previewSignals.length === 0 ? (
                <p className="text-primary font-semibold">✓ Looking good! All inputs align with current company policies.</p>
              ) : (
                previewSignals.map((signal, idx) => (
                  <p key={idx} className="text-muted-foreground font-medium">• {signal}</p>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Main Form */}
        <Card className="max-w-3xl rounded-3xl border border-border bg-card/65 shadow-xl backdrop-blur-md">
          <CardHeader className="border-b border-border bg-muted/20 px-6 py-4">
            <CardTitle className="text-foreground text-base font-bold tracking-tight">Expense Fields</CardTitle>
            <CardDescription className="text-xs text-muted-foreground">Fill in the required transaction information below</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-6">
              {error && (
                <Alert variant="destructive" className="rounded-xl">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs font-medium">{error}</AlertDescription>
                </Alert>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="amount" className="text-xs font-semibold text-muted-foreground uppercase">Amount *</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="0.00"
                    step="0.01"
                    name="amount"
                    value={formData.amount}
                    onChange={handleChange}
                    disabled={isLoading}
                    className="bg-card border-border text-foreground text-xs rounded-xl focus:ring-primary/20 h-10 font-mono"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currency" className="text-xs font-semibold text-muted-foreground uppercase">Currency *</Label>
                  <Select
                    value={formData.currency}
                    onValueChange={(value) => handleSelectChange("currency", value)}
                  >
                    <SelectTrigger disabled={isLoading} className="bg-card border-border text-foreground text-xs rounded-xl focus:ring-primary/20 h-10 font-mono">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border border-border text-xs text-popover-foreground font-mono">
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="VND">VND</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="merchant" className="text-xs font-semibold text-muted-foreground uppercase">Merchant / Vendor *</Label>
                <Input
                  id="merchant"
                  placeholder="e.g., Starbucks, Uber, Hotel ABC"
                  name="merchant"
                  value={formData.merchant}
                  onChange={handleChange}
                  disabled={isLoading}
                  className="bg-card border-border text-foreground text-xs rounded-xl focus:ring-primary/20 h-10"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="category" className="text-xs font-semibold text-muted-foreground uppercase">Category *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => handleSelectChange("category", value)}
                  >
                    <SelectTrigger disabled={isLoading} className="bg-card border-border text-foreground text-xs rounded-xl focus:ring-primary/20 h-10">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border border-border text-xs text-popover-foreground">
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date" className="text-xs font-semibold text-muted-foreground uppercase">Transaction Date *</Label>
                  <Input
                    id="date"
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    disabled={isLoading}
                    className="bg-card border-border text-foreground text-xs rounded-xl focus:ring-primary/20 h-10 font-mono"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-xs font-semibold text-muted-foreground uppercase">Business Purpose / Description</Label>
                <Textarea
                  id="description"
                  placeholder="Explain why this expense was made (e.g. lunch with client, software renewal)"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  disabled={isLoading}
                  className="bg-card border-border text-foreground text-xs rounded-xl focus:ring-primary/20 min-h-[100px]"
                  rows={4}
                />
              </div>

              {/* Action Control Buttons */}
              <div className="flex flex-wrap gap-2 pt-4 border-t border-border">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="gap-2 rounded-full px-6 bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-md"
                >
                  {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                  Submit Expense
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={isLoading}
                  onClick={(e) => handleSubmit(e, true)}
                  className="gap-2 rounded-full px-6 border-border hover:bg-muted text-foreground font-medium"
                >
                  Save as Draft
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  disabled={isLoading}
                  onClick={() => navigate("/expenses")}
                  className="rounded-full px-6 text-muted-foreground hover:text-foreground font-medium"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default CreateExpense;
