import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import Login from "./pages/auth/Login.tsx";
import Register from "./pages/auth/Register.tsx";
import AcceptInvite from "./pages/auth/AcceptInvite.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import ExpensesList from "./pages/expenses/ExpensesList.tsx";
import CreateExpense from "./pages/expenses/CreateExpense.tsx";
import ExpenseDetail from "./pages/expenses/ExpenseDetail.tsx";
import UploadReceipt from "./pages/expenses/UploadReceipt.tsx";
import ManagerPending from "./pages/manager/ManagerPending.tsx";
import AuditTrail from "./pages/manager/AuditTrail.tsx";
import ManagerInsights from "./pages/manager/ManagerInsights.tsx";
import Settings from "./pages/Settings.tsx";
import Subscription from "./pages/Subscription.tsx";
import UserManagement from "./pages/admin/UserManagement.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/accept-invite" element={<AcceptInvite />} />
            
            {/* Protected routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/expenses"
              element={
                <ProtectedRoute>
                  <ExpensesList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/expenses/create"
              element={
                <ProtectedRoute requiredRole={["Admin", "User"]}>
                  <CreateExpense />
                </ProtectedRoute>
              }
            />
            <Route
              path="/expenses/:id"
              element={
                <ProtectedRoute>
                  <ExpenseDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/upload"
              element={
                <ProtectedRoute requiredRole={["Admin", "User"]}>
                  <UploadReceipt />
                </ProtectedRoute>
              }
            />
            <Route
              path="/manager/pending"
              element={
                <ProtectedRoute requiredRole={["Manager", "Admin"]}>
                  <ManagerPending />
                </ProtectedRoute>
              }
            />
            <Route
              path="/manager/audit/:id"
              element={
                <ProtectedRoute requiredRole={["Manager", "Admin"]}>
                  <AuditTrail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/manager/insights"
              element={
                <ProtectedRoute requiredRole={["Manager", "Admin"]}>
                  <ManagerInsights />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings/policy"
              element={
                <ProtectedRoute requiredRole={["Admin"]}>
                  <Settings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute requiredRole={["Admin"]}>
                  <UserManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/subscription"
              element={
                <ProtectedRoute requiredRole={["Admin", "User"]}>
                  <Subscription />
                </ProtectedRoute>
              }
            />
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
