import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { expenseService, Expense } from "@/services/expenseService";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertCircle, Eye, Trash2, Loader2, Plus } from "lucide-react";

const ALL_STATUSES = "all-statuses";
const ALL_RISKS = "all-risks";
const SORT_MOST_RISKY = "most-risky";
const SORT_LEAST_RISKY = "least-risky";
const SORT_NEWEST = "newest";

const ExpensesList = () => {
  const { user } = useAuth();
  const canUseSubmitterFeatures = user?.role === "Admin" || user?.role === "User";
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState(ALL_STATUSES);
  const [riskFilter, setRiskFilter] = useState(ALL_RISKS);
  const [sortMode, setSortMode] = useState(SORT_MOST_RISKY);

  useEffect(() => {
    const fetchExpenses = async () => {
      const result = await expenseService.getAll();
      if (result.success && result.data) {
        setExpenses(result.data);
        setFilteredExpenses(result.data);
      }
      setIsLoading(false);
    };

    fetchExpenses();
  }, []);

  useEffect(() => {
    let filtered = expenses;

    if (statusFilter !== ALL_STATUSES) {
      filtered = filtered.filter((e) => e.status === statusFilter);
    }

    if (riskFilter !== ALL_RISKS) {
      filtered = filtered.filter((e) => e.riskAssessment.riskLevel === riskFilter);
    }

    filtered = [...filtered].sort((a, b) => {
      if (sortMode === SORT_LEAST_RISKY) {
        return a.riskAssessment.riskScore - b.riskAssessment.riskScore;
      }

      if (sortMode === SORT_NEWEST) {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }

      return b.riskAssessment.riskScore - a.riskAssessment.riskScore;
    });

    setFilteredExpenses(filtered);
  }, [expenses, statusFilter, riskFilter, sortMode]);

  const getStatusBadge = (status: string) => {
    const variants: { [key: string]: "outline" | "secondary" | "destructive" | "default" } = {
      Draft: "outline",
      Pending: "secondary",
      Approved: "default",
      Rejected: "destructive",
    };
    return <Badge variant={variants[status] || "outline"}>{status}</Badge>;
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

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this expense?")) {
      const result = await expenseService.delete(id);
      if (result.success) {
        setExpenses(expenses.filter((e) => e.id !== id));
      }
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
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-4 rounded-[2rem] border border-border/60 bg-card/80 p-6 shadow-sm backdrop-blur md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">Operations</p>
            <h1 className="mt-2 text-3xl font-bold text-foreground">Expenses</h1>
            <p className="mt-1 text-muted-foreground">View, filter, and manage your expense reports.</p>
          </div>
          {canUseSubmitterFeatures && (
            <Button asChild className="w-full gap-2 rounded-full px-6 md:w-auto">
              <Link to="/expenses/create">
                <Plus className="h-4 w-4" />
                New Expense
              </Link>
            </Button>
          )}
        </div>

        {/* Filters */}
        <div className="grid gap-4 rounded-[2rem] border border-border/60 bg-card/80 p-5 shadow-sm backdrop-blur md:grid-cols-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_STATUSES}>All statuses</SelectItem>
              <SelectItem value="Draft">Draft</SelectItem>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="Approved">Approved</SelectItem>
              <SelectItem value="Rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>

          <Select value={riskFilter} onValueChange={setRiskFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by risk level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_RISKS}>All risk levels</SelectItem>
              <SelectItem value="Low">Low</SelectItem>
              <SelectItem value="Medium">Medium</SelectItem>
              <SelectItem value="High">High</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortMode} onValueChange={setSortMode}>
            <SelectTrigger>
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={SORT_MOST_RISKY}>Most risky first</SelectItem>
              <SelectItem value={SORT_LEAST_RISKY}>Least risky first</SelectItem>
              <SelectItem value={SORT_NEWEST}>Newest first</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <Card className="rounded-[2rem] border-border/60 bg-card/85 shadow-sm backdrop-blur">
          <CardHeader>
            <CardTitle>Your Expenses</CardTitle>
            <CardDescription>Total: {filteredExpenses.length} expenses</CardDescription>
          </CardHeader>
          <CardContent>
            {filteredExpenses.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <AlertCircle className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground mb-4">No expenses found</p>
                {canUseSubmitterFeatures && (
                  <Button asChild>
                    <Link to="/expenses/create">Create your first expense</Link>
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Merchant</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Risk</TableHead>
                      <TableHead>Top Signal</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredExpenses.map((expense) => (
                      <TableRow key={expense.id}>
                        <TableCell className="font-medium">
                          {formatDate(expense.date)}
                        </TableCell>
                        <TableCell>{expense.merchant}</TableCell>
                        <TableCell>{expense.category}</TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(expense.amount, expense.currency)}
                        </TableCell>
                        <TableCell>{getStatusBadge(expense.status)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {expense.riskAssessment && (
                              <>
                                {getRiskBadge(expense.riskAssessment.riskLevel)}
                                <span className="text-xs text-muted-foreground">
                                  {expense.riskAssessment.riskScore}%
                                </span>
                              </>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="max-w-[260px] text-sm text-muted-foreground">
                          {expense.riskAssessment?.riskReasons?.[0] || "No unusual signals detected"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Button
                              asChild
                              variant="ghost"
                              size="sm"
                              title="View details"
                            >
                              <Link to={`/expenses/${expense.id}`}>
                                <Eye className="h-4 w-4" />
                              </Link>
                            </Button>
                            {expense.status === "Draft" && user?.role !== "Manager" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(expense.id)}
                                title="Delete expense"
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            )}
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
      </div>
    </DashboardLayout>
  );
};

export default ExpensesList;
