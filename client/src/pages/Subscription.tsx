import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { subscriptionService, SubscriptionPlan, CurrentSubscription, BillingHistoryItem } from "@/services/subscriptionService";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Loader2, CheckCircle, CreditCard, Calendar, TrendingUp, Download, X } from "lucide-react";

const Subscription = () => {
  const navigate = useNavigate();
  const { user, refreshProfile } = useAuth();
  const canManageSubscription = user?.role === "Admin";
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<CurrentSubscription | null>(null);
  const [billingHistory, setBillingHistory] = useState<BillingHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError("");

      const [plansRes, subRes, historyRes] = await Promise.all([
        subscriptionService.getPlans(),
        subscriptionService.getCurrentSubscription(),
        subscriptionService.getBillingHistory(),
      ]);

      if (plansRes.success && plansRes.data) {
        setPlans(plansRes.data.plans);
      } else {
        setError(plansRes.error || "Failed to load plans");
      }

      if (subRes.success && subRes.data) {
        setCurrentSubscription(subRes.data);
      }

      if (historyRes.success && historyRes.data) {
        setBillingHistory(historyRes.data);
      }

      setIsLoading(false);
    };

    fetchData();
  }, []);

  const handleSubscribe = async (planId: string) => {
    if (!canManageSubscription) {
      setError("Only Admin can manage subscription changes.");
      return;
    }
    setError("");
    setSelectedPlanId(planId);
    setIsSubscribing(true);

    const result = await subscriptionService.subscribe(planId, billingCycle);

    if (result.success) {
      await refreshProfile();
      setCurrentSubscription(null);
      // Reload subscription
      const subRes = await subscriptionService.getCurrentSubscription();
      if (subRes.success && subRes.data) {
        setCurrentSubscription(subRes.data);
      }
    } else {
      setError(result.error || "Failed to subscribe");
    }

    setIsSubscribing(false);
    setSelectedPlanId(null);
  };

  const handleUpgrade = async (planId: string) => {
    if (!currentSubscription) return;
    if (!canManageSubscription) {
      setError("Only Admin can manage subscription changes.");
      return;
    }

    setError("");
    setIsUpgrading(planId);

    const result = await subscriptionService.upgradeSubscription(planId);

    if (result.success) {
      await refreshProfile();
      // Reload subscription
      const subRes = await subscriptionService.getCurrentSubscription();
      if (subRes.success && subRes.data) {
        setCurrentSubscription(subRes.data);
      }
    } else {
      setError(result.error || "Failed to upgrade subscription");
    }

    setIsUpgrading(null);
  };

  const handleCancel = async () => {
    if (!canManageSubscription) {
      setError("Only Admin can manage subscription changes.");
      return;
    }
    if (!confirm("Are you sure you want to cancel your subscription? You will lose access to premium features.")) {
      return;
    }

    setError("");
    setIsCancelling(true);

    const result = await subscriptionService.cancelSubscription();

    if (result.success) {
      await refreshProfile();
      setCurrentSubscription(null);
    } else {
      setError(result.error || "Failed to cancel subscription");
    }

    setIsCancelling(false);
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-6xl">
        {/* Header */}
        <div className="rounded-[2rem] border border-border/60 bg-card/80 p-6 shadow-sm backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <CreditCard className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">Billing</p>
              <h1 className="mt-2 text-3xl font-bold text-foreground">Subscription</h1>
            </div>
          </div>
          <p className="mt-4 text-muted-foreground">Manage your subscription plan and billing settings.</p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!canManageSubscription && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Your plan is managed by your Admin. You can view subscription details here, but only Admin can make changes.
            </AlertDescription>
          </Alert>
        )}

        {/* Current Subscription */}
        {currentSubscription && (
          <Card className="rounded-[2rem] border-primary/20 bg-gradient-to-br from-primary/5 to-primary/2 shadow-sm backdrop-blur">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Badge className="bg-primary">{currentSubscription.status.toUpperCase()}</Badge>
                    {currentSubscription.planName} Plan
                  </CardTitle>
                  <CardDescription>Your current subscription</CardDescription>
                </div>
                <Badge variant="outline" className="h-fit">
                  {currentSubscription.billingCycle === "monthly" ? "Monthly" : "Annual"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-4">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Current Price</p>
                  <p className="text-2xl font-bold text-foreground">${currentSubscription.price.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">/{currentSubscription.billingCycle}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Started On</p>
                  <p className="font-medium text-foreground">{new Date(currentSubscription.startDate).toLocaleDateString()}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Renewal Date</p>
                  {currentSubscription.renewalDate ? (
                    <p className="font-medium text-foreground">{new Date(currentSubscription.renewalDate).toLocaleDateString()}</p>
                  ) : (
                    <p className="font-medium text-muted-foreground">-</p>
                  )}
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Days Until Renewal</p>
                  <p className="text-2xl font-bold text-primary">{currentSubscription.daysUntilRenewal}</p>
                  <p className="text-xs text-muted-foreground">days remaining</p>
                </div>
              </div>

              <div className="border-t border-border/40 pt-4">
                <Button variant="destructive" onClick={handleCancel} disabled={isCancelling || !canManageSubscription} className="gap-2">
                  {isCancelling && <Loader2 className="h-4 w-4 animate-spin" />}
                  {isCancelling ? "Cancelling..." : "Cancel Subscription"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {!currentSubscription && (
          <Card className="rounded-[2rem] border-dashed border-border/60 bg-card/50">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-lg font-medium text-foreground mb-2">No Active Subscription</p>
              <p className="text-sm text-muted-foreground mb-6">Choose a plan below to get started</p>
            </CardContent>
          </Card>
        )}

        {/* Available Plans */}
        <div>
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-foreground mb-2">Available Plans</h2>
            <p className="text-muted-foreground">Choose the plan that best fits your needs</p>
          </div>

          {/* Billing Cycle Toggle */}
          <div className="mb-6 flex items-center gap-4 rounded-lg bg-card/80 p-4 w-fit">
            <p className="text-sm font-medium">Billing Cycle:</p>
            <div className="flex gap-2">
              <Button
                variant={billingCycle === "monthly" ? "default" : "ghost"}
                onClick={() => setBillingCycle("monthly")}
                className="rounded-full px-4"
                size="sm"
              >
                Monthly
              </Button>
              <Button
                variant={billingCycle === "annual" ? "default" : "ghost"}
                onClick={() => setBillingCycle("annual")}
                className="rounded-full px-4"
                size="sm"
              >
                Annual
                <Badge className="ml-2 bg-green-100 text-green-800">Save 12%</Badge>
              </Button>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {plans.map((plan) => {
              const isCurrentPlan = currentSubscription?.planId === plan.id;
              const canUpgrade = currentSubscription && plan.id !== currentSubscription.planId;
              const planOrder = { starter: 0, professional: 1, enterprise: 2 };
              const canOnlyUpgrade = canUpgrade && (planOrder[plan.id as keyof typeof planOrder] || 0) > (planOrder[currentSubscription?.planId as keyof typeof planOrder] || 0);

              return (
                <Card
                  key={plan.id}
                  className={`rounded-[2rem] flex flex-col transition-all ${
                    isCurrentPlan
                      ? "border-primary bg-primary/5 shadow-lg"
                      : "border-border/60 bg-card/85 shadow-sm hover:border-primary/30"
                  }`}
                >
                  {isCurrentPlan && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-primary">Current Plan</Badge>
                    </div>
                  )}

                  <CardHeader>
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                    <div className="mt-4">
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-extrabold text-foreground">
                          ${billingCycle === "monthly" ? plan.monthlyPrice : Math.round(plan.annualPrice / 12)}
                        </span>
                        <span className="text-muted-foreground">/{billingCycle === "monthly" ? "mo" : "mo (annual)"}</span>
                      </div>
                      {billingCycle === "annual" && (
                        <p className="text-xs text-muted-foreground mt-1">
                          ${plan.annualPrice.toFixed(0)}/year
                        </p>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="flex flex-1 flex-col">
                    <div className="space-y-3 mb-6">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-primary" />
                        <span className="font-medium">{plan.expenseLimit.toLocaleString()} expenses/month</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-primary" />
                        <span className="font-medium">{plan.userSeats} user {plan.userSeats === 1 ? "seat" : "seats"}</span>
                      </div>
                    </div>

                    <div className="flex-1 border-t border-border/40 pt-4 mb-6">
                      <p className="text-xs font-semibold uppercase text-muted-foreground mb-3">Features:</p>
                      <ul className="space-y-2">
                        {plan.features.map((feature) => (
                          <li key={feature} className="flex items-start gap-2 text-sm text-muted-foreground">
                            <CheckCircle className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      {isCurrentPlan && (
                        <Button disabled className="w-full rounded-full">
                          Current Plan
                        </Button>
                      )}
                      {!isCurrentPlan && currentSubscription && canOnlyUpgrade && (
                        <Button
                          onClick={() => handleUpgrade(plan.id)}
                          disabled={isUpgrading === plan.id || !canManageSubscription}
                          className="w-full rounded-full bg-primary hover:bg-primary/90"
                        >
                          {isUpgrading === plan.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          {isUpgrading === plan.id ? "Upgrading..." : "Upgrade"}
                        </Button>
                      )}
                      {!isCurrentPlan && (!currentSubscription || !canOnlyUpgrade) && (
                        <Button
                          onClick={() => handleSubscribe(plan.id)}
                          disabled={(isSubscribing && selectedPlanId === plan.id) || !canManageSubscription}
                          className="w-full rounded-full"
                          variant={isCurrentPlan ? "outline" : "default"}
                        >
                          {isSubscribing && selectedPlanId === plan.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          {isSubscribing && selectedPlanId === plan.id ? "Subscribing..." : !currentSubscription ? "Choose Plan" : "Downgrade"}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Billing History */}
        {billingHistory.length > 0 && (
          <Card className="rounded-[2rem] border-border/60 bg-card/85 shadow-sm backdrop-blur">
            <CardHeader>
              <CardTitle>Billing History</CardTitle>
              <CardDescription>Your recent invoices and payments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border/40">
                      <th className="text-left py-3 px-4 font-medium text-sm text-muted-foreground">Date</th>
                      <th className="text-left py-3 px-4 font-medium text-sm text-muted-foreground">Description</th>
                      <th className="text-left py-3 px-4 font-medium text-sm text-muted-foreground">Plan</th>
                      <th className="text-right py-3 px-4 font-medium text-sm text-muted-foreground">Amount</th>
                      <th className="text-left py-3 px-4 font-medium text-sm text-muted-foreground">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {billingHistory.map((item) => (
                      <tr key={item.id} className="border-b border-border/20 hover:bg-background/50 transition">
                        <td className="py-3 px-4 text-sm">{new Date(item.date).toLocaleDateString()}</td>
                        <td className="py-3 px-4 text-sm">{item.description}</td>
                        <td className="py-3 px-4 text-sm">{item.planName}</td>
                        <td className="py-3 px-4 text-sm font-medium text-right">${item.amount.toFixed(2)}</td>
                        <td className="py-3 px-4 text-sm">
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            {item.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Enterprise Contact */}
        <Card className="rounded-[2rem] border-border/60 bg-card/85 shadow-sm backdrop-blur">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="font-semibold text-foreground mb-1">Need a Custom Plan?</h3>
                <p className="text-sm text-muted-foreground">Our sales team can help you find the perfect solution for your organization.</p>
              </div>
              <Button variant="outline" className="rounded-full">
                Contact Sales
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Subscription;
