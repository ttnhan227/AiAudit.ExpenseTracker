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
import { AlertCircle, Loader2, ArrowLeft } from "lucide-react";

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

    if (amount >= 2_000_000) {
      signals.push("Large amount: this likely enters mandatory manager review.");
    }

    if (formData.category.toLowerCase().includes("alcohol")) {
      signals.push("Restricted category detected: this may trigger a policy violation.");
    }

    if (!formData.description.trim()) {
      signals.push("Missing business justification increases risk and slows approvals.");
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
          // If not saving as draft, submit the expense
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
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4 rounded-[2rem] border border-border/60 bg-card/80 p-6 shadow-sm backdrop-blur">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/expenses")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">Capture</p>
            <h1 className="mt-2 text-3xl font-bold text-foreground">Create Expense</h1>
            <p className="mt-1 text-muted-foreground">Add a new expense and submit it for review.</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card className="rounded-[2rem] border-border/60 bg-card/80 shadow-sm backdrop-blur">
            <CardHeader>
              <CardTitle className="text-base">Policy Guardrails</CardTitle>
              <CardDescription>What reviewers and controls will validate</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>Amount above 2,000,000 VND is treated as elevated risk.</p>
              <p>Alcohol and restricted categories trigger policy checks.</p>
              <p>Strong description and receipt evidence reduce manual escalations.</p>
            </CardContent>
          </Card>

          <Card className="rounded-[2rem] border-border/60 bg-secondary/30 shadow-sm backdrop-blur">
            <CardHeader>
              <CardTitle className="text-base">Pre-Submit Risk Preview</CardTitle>
              <CardDescription>Live signals based on your current form</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {previewSignals.length === 0 ? (
                <p className="text-muted-foreground">No obvious policy concerns detected yet.</p>
              ) : (
                previewSignals.map((signal) => (
                  <p key={signal} className="text-foreground">• {signal}</p>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Form */}
        <Card className="max-w-3xl rounded-[2rem] border-border/60 bg-card/85 shadow-sm backdrop-blur">
          <CardHeader>
            <CardTitle>Expense Details</CardTitle>
            <CardDescription>Fill in the expense information below</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount *</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="0.00"
                    step="0.01"
                    name="amount"
                    value={formData.amount}
                    onChange={handleChange}
                    disabled={isLoading}
                    className="border-border/50"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currency">Currency *</Label>
                  <Select
                    value={formData.currency}
                    onValueChange={(value) => handleSelectChange("currency", value)}
                  >
                    <SelectTrigger disabled={isLoading}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="VND">VND</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="merchant">Merchant *</Label>
                <Input
                  id="merchant"
                  placeholder="e.g., Starbucks, Uber, Hotel ABC"
                  name="merchant"
                  value={formData.merchant}
                  onChange={handleChange}
                  disabled={isLoading}
                  className="border-border/50"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => handleSelectChange("category", value)}
                  >
                    <SelectTrigger disabled={isLoading}>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date">Date *</Label>
                  <Input
                    id="date"
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    disabled={isLoading}
                    className="border-border/50"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Add any additional details about this expense"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  disabled={isLoading}
                  className="border-border/50"
                  rows={4}
                />
              </div>

              {/* Buttons */}
              <div className="flex flex-wrap gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="gap-2 rounded-full px-6"
                >
                  {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                  Submit Expense
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={isLoading}
                  onClick={(e) => handleSubmit(e, true)}
                  className="gap-2 rounded-full px-6"
                >
                  Save as Draft
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  disabled={isLoading}
                  onClick={() => navigate("/expenses")}
                  className="rounded-full px-6"
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
