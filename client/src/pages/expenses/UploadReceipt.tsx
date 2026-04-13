import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { aiService, AiUploadResponse } from "@/services/aiService";
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
import { AlertCircle, Loader2, Upload, ArrowLeft, Check } from "lucide-react";

const CATEGORIES = [
  "Travel",
  "Meals",
  "Accommodation",
  "Office Supplies",
  "Software",
  "Other",
];

const CATEGORY_NORMALIZATION: Record<string, string> = {
  travel: "Travel",
  transport: "Travel",
  transportation: "Travel",
  taxi: "Travel",
  uber: "Travel",
  grab: "Travel",
  flight: "Travel",
  lodging: "Accommodation",
  hotel: "Accommodation",
  accommodation: "Accommodation",
  meal: "Meals",
  meals: "Meals",
  food: "Meals",
  beverage: "Meals",
  restaurant: "Meals",
  software: "Software",
  saas: "Software",
  office: "Office Supplies",
  supplies: "Office Supplies",
  stationery: "Office Supplies",
  other: "Other",
  general: "Other",
};

const UploadReceipt = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<"upload" | "review" | "confirm">("upload");
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
  const [uploadData, setUploadData] = useState<AiUploadResponse | null>(null);
  const [receiptPreviewUrl, setReceiptPreviewUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form data for review/confirm
  const [formData, setFormData] = useState({
    amount: "",
    currency: "USD",
    merchant: "",
    category: "",
    customCategory: "",
    date: new Date().toISOString().split("T")[0],
    description: "",
  });

  const normalizeCategory = (rawCategory?: string) => {
    if (!rawCategory) return "Other";
    const normalized = CATEGORY_NORMALIZATION[rawCategory.trim().toLowerCase()];
    if (normalized) return normalized;
    return CATEGORIES.includes(rawCategory) ? rawCategory : "Other";
  };

  const normalizeDateForInput = (rawDate?: string) => {
    const today = new Date().toISOString().split("T")[0];
    if (!rawDate) return today;

    const trimmed = rawDate.trim();
    const isoMatch = trimmed.match(/^\d{4}-\d{2}-\d{2}/);
    if (isoMatch) return isoMatch[0];

    const normalized = trimmed.replace(/\./g, "/").replace(/-/g, "/");
    const parts = normalized.split("/").map((segment) => segment.trim());
    if (parts.length === 3) {
      const [a, b, c] = parts;
      const yearCandidate = Number(c.length === 4 ? c : a.length === 4 ? a : NaN);

      if (!Number.isNaN(yearCandidate)) {
        if (a.length === 4) {
          const year = Number(a);
          const month = Number(b);
          const day = Number(c);
          if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
            return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          }
        }

        if (c.length === 4) {
          const year = Number(c);
          const first = Number(a);
          const second = Number(b);

          // Prefer day/month for receipts outside US formatting habits.
          const dayFirstValid = first >= 1 && first <= 31 && second >= 1 && second <= 12;
          const monthFirstValid = first >= 1 && first <= 12 && second >= 1 && second <= 31;

          if (dayFirstValid && !monthFirstValid) {
            return `${String(year).padStart(4, "0")}-${String(second).padStart(2, "0")}-${String(first).padStart(2, "0")}`;
          }

          if (monthFirstValid) {
            return `${String(year).padStart(4, "0")}-${String(first).padStart(2, "0")}-${String(second).padStart(2, "0")}`;
          }
        }
      }
    }

    const parsed = new Date(trimmed);
    if (Number.isNaN(parsed.getTime())) return today;

    const year = parsed.getFullYear();
    const month = String(parsed.getMonth() + 1).padStart(2, "0");
    const day = String(parsed.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const deriveCustomCategory = (rawCategory?: string) => {
    if (!rawCategory) return "";
    const trimmed = rawCategory.trim();
    if (!trimmed) return "";

    const normalizedKey = trimmed.toLowerCase();
    const mapped = CATEGORY_NORMALIZATION[normalizedKey];
    if (mapped && mapped !== "Other") return "";
    if (normalizedKey === "other" || normalizedKey === "general") return "";
    if (CATEGORIES.includes(trimmed)) return "";
    return trimmed;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      if (selected.size > 10 * 1024 * 1024) {
        setError("File too large. Please upload a file under 10MB.");
        return;
      }

      setFile(selected);
      setError("");
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError("Please select a file");
      return;
    }

    setIsUploading(true);
    setError("");

    try {
      const result = await aiService.uploadReceipt(file);
      if (result.success && result.data) {
        setUploadData(result.data);
        // Pre-fill form with extracted data
        const normalizedCategory = normalizeCategory(result.data.category);
        const normalizedDate = normalizeDateForInput(result.data.date);
        const customCategory = deriveCustomCategory(result.data.category);
        const suggestedDescription = result.data.message?.trim()
          ? result.data.message.trim()
          : `Expense at ${result.data.merchant || "merchant"}`;

        setFormData({
          amount: result.data.amount?.toString() || "",
          currency: result.data.currency || "USD",
          merchant: result.data.merchant || "",
          category: normalizedCategory,
          customCategory,
          date: normalizedDate,
          description: suggestedDescription,
        });
        setReceiptPreviewUrl(URL.createObjectURL(file));
        setStep("review");
      } else {
        setError(result.error || "Failed to upload receipt");
      }
    } catch (err: any) {
      setError(err?.message || "An error occurred while uploading the receipt");
    } finally {
      setIsUploading(false);
    }
  };

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

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.amount) {
      setError("Amount is required");
      return;
    }

    if (!formData.merchant.trim()) {
      setError("Merchant is required");
      return;
    }

    if (!formData.category) {
      setError("Category is required");
      return;
    }

    if (formData.category === "Other" && !formData.customCategory.trim()) {
      setError("Please specify a category when selecting Other");
      return;
    }

    const finalCategory = formData.category === "Other"
      ? formData.customCategory.trim()
      : formData.category;

    setIsSubmitting(true);

    try {
      const confirmResult = await aiService.confirmReceipt({
        amount: parseFloat(formData.amount),
        currency: formData.currency,
        merchant: formData.merchant,
        date: formData.date,
        category: finalCategory,
        description: formData.description || undefined,
        fileUrl: uploadData?.fileUrl || "",
        ocrRawData: uploadData?.ocrRawData,
      });

      if (confirmResult.success && confirmResult.data) {
        setStep("confirm");
        setTimeout(() => {
          navigate(`/expenses/${confirmResult.data!.id}`);
        }, 2000);
      } else {
        setError(confirmResult.error || "Failed to confirm receipt");
        setIsSubmitting(false);
      }
    } catch (err) {
      setError("An error occurred while processing the receipt");
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          {step !== "upload" && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setStep("upload");
                setFile(null);
                setUploadData(null);
                setReceiptPreviewUrl("");
                setError("");
              }}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <div>
            <h1 className="text-3xl font-bold text-foreground">Upload Receipt</h1>
            <p className="text-muted-foreground">
              {step === "upload" && "Upload a receipt image for AI extraction"}
              {step === "review" && "Review and edit extracted data"}
              {step === "confirm" && "Expense created successfully"}
            </p>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Upload Step */}
        {step === "upload" && (
          <Card className="border-border/50 max-w-2xl">
            <CardHeader>
              <CardTitle>Upload Receipt Image</CardTitle>
              <CardDescription>
                Upload a clear photo of your receipt. Supported formats: JPG, PNG, PDF
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpload} className="space-y-6">
                <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border/50 bg-secondary/5 p-8">
                  <Upload className="h-12 w-12 text-muted-foreground mb-4" />
                  <label htmlFor="file-input" className="cursor-pointer">
                    <p className="text-lg font-semibold text-foreground">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {file ? file.name : "PNG, JPG, PDF up to 10MB"}
                    </p>
                  </label>
                  <Input
                    id="file-input"
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={handleFileChange}
                    disabled={isUploading}
                    className="hidden"
                  />
                </div>

                {file && (
                  <div className="rounded-lg bg-primary/10 p-3 flex items-center gap-2">
                    <Check className="h-5 w-5 text-primary" />
                    <span className="text-sm font-medium">{file.name}</span>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={isUploading || !file}
                  className="w-full gap-2"
                >
                  {isUploading && <Loader2 className="h-4 w-4 animate-spin" />}
                  {isUploading ? "Uploading..." : "Upload Receipt"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Review & Edit Step */}
        {step === "review" && (
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Image Preview */}
            {receiptPreviewUrl && (
              <Card className="border-border/50 lg:col-span-1">
                <CardHeader>
                  <CardTitle className="text-lg">Receipt Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  <img
                    src={receiptPreviewUrl}
                    alt="Receipt preview"
                    className="w-full rounded-lg border border-border/50"
                  />
                </CardContent>
              </Card>
            )}

            {/* Edit Form */}
            <Card className={`border-border/50 ${receiptPreviewUrl ? "lg:col-span-2" : "lg:col-span-3"}`}>
              <CardHeader>
                <CardTitle>Review Extracted Data</CardTitle>
                <CardDescription>
                  Review and edit the data extracted from your receipt
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleConfirm} className="space-y-6">
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
                        disabled={isSubmitting}
                        className="border-border/50"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="currency">Currency *</Label>
                      <Select
                        value={formData.currency}
                        onValueChange={(value) => handleSelectChange("currency", value)}
                      >
                        <SelectTrigger disabled={isSubmitting}>
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
                      disabled={isSubmitting}
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
                        <SelectTrigger disabled={isSubmitting}>
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
                        disabled={isSubmitting}
                        className="border-border/50"
                      />
                    </div>
                  </div>

                  {formData.category === "Other" && (
                    <div className="space-y-2">
                      <Label htmlFor="customCategory">Specify Category *</Label>
                      <Input
                        id="customCategory"
                        placeholder="e.g., Fuel, Marketing, Client Entertainment"
                        name="customCategory"
                        value={formData.customCategory}
                        onChange={handleChange}
                        disabled={isSubmitting}
                        className="border-border/50"
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <Label htmlFor="description">Description</Label>
                      <span className="text-xs text-primary">AI suggested</span>
                    </div>
                    <Textarea
                      id="description"
                      placeholder="AI suggested description (editable)"
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      disabled={isSubmitting}
                      className="border-border/50"
                      rows={3}
                    />
                    <p className="text-xs text-muted-foreground">
                      Review and edit this draft before creating the expense.
                    </p>
                  </div>

                  <div className="flex gap-4 pt-4">
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="gap-2"
                    >
                      {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                      {isSubmitting ? "Creating..." : "Create Expense"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={isSubmitting}
                      onClick={() => {
                        setStep("upload");
                        setFile(null);
                        setUploadData(null);
                        setReceiptPreviewUrl("");
                      }}
                    >
                      Start Over
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Success Step */}
        {step === "confirm" && (
          <Card className="border-border/50 max-w-2xl mx-auto bg-primary/5">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Check className="h-16 w-16 text-primary mb-4" />
              <h2 className="text-2xl font-bold text-foreground mb-2">Expense Created!</h2>
              <p className="text-muted-foreground text-center mb-6">
                Your receipt has been uploaded and the expense has been created. Redirecting...
              </p>
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default UploadReceipt;
