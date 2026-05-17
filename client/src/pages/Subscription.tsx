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
  const canManageSubscription = user?.role === "Owner";
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
      setError("Only Owner can manage subscription changes.");
      return;
    }
    setError("");
    setSelectedPlanId(planId);
    setIsSubscribing(true);

    const result = await subscriptionService.subscribe(planId, billingCycle);

    if (result.success) {
      await refreshProfile();
      setCurrentSubscription(null);
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
      setError("Only Owner can manage subscription changes.");
      return;
    }

    setError("");
    setIsUpgrading(planId);

    const result = await subscriptionService.upgradeSubscription(planId);

    if (result.success) {
      await refreshProfile();
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
      setError("Only Owner can manage subscription changes.");
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
      <div className="space-y-6 max-w-6xl font-sans">
        
        {/* Header Ribbon - perfectly structurally matching other pages */}
        <div className="flex items-center gap-4 rounded-3xl border border-border bg-card/65 p-6 shadow-xl backdrop-blur-md">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 text-primary">
            <CreditCard className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[10px] font-mono tracking-[0.28em] text-primary bg-primary/5 px-2 py-0.5 border border-primary/10 rounded uppercase">
              Financial Tier
            </span>
            <h1 className="text-3xl font-extrabold tracking-tight mt-1.5">Subscription</h1>
            <p className="text-sm text-muted-foreground font-sans">
              Manage your company billing history, plan upgrades, and team workspace size.
            </p>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="rounded-xl">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs font-semibold">{error}</AlertDescription>
          </Alert>
        )}

        {!canManageSubscription && (
          <Alert className="rounded-xl border-border bg-muted/40 text-xs">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-muted-foreground leading-relaxed">
              Your plan is managed by the workspace Owner. You can view plan limits below, but only Owner accounts can edit subscriptions.
            </AlertDescription>
          </Alert>
        )}

        {/* Current Subscription Card */}
        {currentSubscription && (
          <Card className="rounded-3xl border border-primary/30 bg-primary/[0.02] shadow-xl backdrop-blur-md overflow-hidden">
            <CardHeader className="border-b border-primary/10 bg-primary/5 px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base font-bold text-foreground">
                    <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/10 uppercase tracking-widest text-[9px] font-bold font-mono">
                      {currentSubscription.status}
                    </Badge>
                    {currentSubscription.planName} Plan Active
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground">Your active workspace plan limits</CardDescription>
                </div>
                <Badge variant="outline" className="h-fit text-xs font-mono uppercase rounded-lg border-border">
                  {currentSubscription.billingCycle}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Current Price</p>
                  <p className="text-2xl font-bold text-foreground font-mono">
                    ${currentSubscription.price.toFixed(2)}
                  </p>
                  <p className="text-[10px] text-muted-foreground uppercase font-mono">per {currentSubscription.billingCycle}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Started On</p>
                  <p className="text-sm font-bold text-foreground font-mono">{new Date(currentSubscription.startDate).toLocaleDateString()}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Renewal Date</p>
                  {currentSubscription.renewalDate ? (
                    <p className="text-sm font-bold text-foreground font-mono">{new Date(currentSubscription.renewalDate).toLocaleDateString()}</p>
                  ) : (
                    <p className="text-sm font-bold text-muted-foreground">-</p>
                  )}
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Time Remaining</p>
                  <p className="text-2xl font-bold text-primary font-mono">{currentSubscription.daysUntilRenewal}</p>
                  <p className="text-[10px] text-muted-foreground uppercase font-mono">days until renewal</p>
                </div>
              </div>

              {canManageSubscription && (
                <div className="border-t border-border pt-4">
                  <Button 
                    variant="destructive" 
                    onClick={handleCancel} 
                    disabled={isCancelling} 
                    className="gap-2 rounded-full px-5 text-xs font-bold bg-destructive/10 text-destructive border border-destructive/25 hover:bg-destructive hover:text-destructive-foreground shadow-sm h-8"
                  >
                    {isCancelling && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    Cancel Subscription
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {!currentSubscription && (
          <Card className="rounded-3xl border border-dashed border-border bg-card/65 p-6 text-center shadow-xl backdrop-blur-md">
            <CardContent className="flex flex-col items-center justify-center py-6">
              <AlertCircle className="h-12 w-12 text-muted-foreground mb-4 animate-pulse" />
              <p className="text-lg font-bold text-foreground">No Active Subscription Plan</p>
              <p className="text-xs text-muted-foreground mt-1 mb-6">Choose a plan below to activate your corporate workspace.</p>
            </CardContent>
          </Card>
        )}

        {/* Available Plans */}
        <div className="space-y-6">
          <div className="border-b border-border pb-3">
            <h2 className="text-xl font-bold text-foreground">Available Workspace Tiers</h2>
            <p className="text-xs text-muted-foreground mt-1">Upgrade your capabilities or purchase larger seat counts.</p>
          </div>

          {/* Billing Toggle in standard rounded container */}
          <div className="flex items-center gap-4 bg-card/65 border border-border p-3 rounded-2xl w-fit shadow-md">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Billing Cycle:</span>
            <div className="flex bg-muted p-1 border border-border rounded-full">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setBillingCycle("monthly")}
                className={`rounded-full px-3 py-1 h-7 text-xs font-semibold transition-all ${
                  billingCycle === "monthly" 
                    ? "bg-card text-foreground shadow-sm" 
                    : "text-muted-foreground hover:text-foreground hover:bg-transparent"
                }`}
              >
                Monthly
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setBillingCycle("annual")}
                className={`rounded-full px-3 py-1 h-7 text-xs font-semibold gap-1.5 transition-all ${
                  billingCycle === "annual" 
                    ? "bg-primary text-primary-foreground font-bold shadow-sm" 
                    : "text-muted-foreground hover:text-foreground hover:bg-transparent"
                }`}
              >
                Annual
                <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/10 text-[9px] font-bold py-0 h-4 px-1.5 rounded">
                  Save 12%
                </Badge>
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
                  className={`rounded-3xl border flex flex-col transition-all duration-300 relative shadow-xl backdrop-blur-md ${
                    isCurrentPlan
                      ? "border-primary bg-primary/[0.02]"
                      : "border-border bg-card/65 hover:border-primary/20"
                  }`}
                >
                  {isCurrentPlan && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-primary text-primary-foreground font-bold tracking-widest text-[9px] px-2 py-0.5 rounded uppercase">Active</Badge>
                    </div>
                  )}

                  <CardHeader className="border-b border-border/40 pb-4">
                    <CardTitle className="text-lg font-bold text-foreground uppercase tracking-wide">{plan.name}</CardTitle>
                    <CardDescription className="text-xs text-muted-foreground">{plan.description}</CardDescription>
                    <div className="mt-4">
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-extrabold text-foreground font-mono">
                          ${billingCycle === "monthly" ? plan.monthlyPrice : Math.round(plan.annualPrice / 12)}
                        </span>
                        <span className="text-xs text-muted-foreground font-mono">/mo {billingCycle === "annual" && "(annual)"}</span>
                      </div>
                      {billingCycle === "annual" && (
                        <p className="text-[10px] text-muted-foreground font-mono mt-1">
                          ${plan.annualPrice.toFixed(0)} billed yearly
                        </p>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="flex flex-1 flex-col p-6">
                    <div className="space-y-3 mb-6 text-xs text-foreground">
                      <div className="flex items-center gap-2.5">
                        <TrendingUp className="h-4 w-4 text-primary shrink-0" />
                        <span className="font-semibold">{plan.expenseLimit.toLocaleString()} monthly claims</span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <Calendar className="h-4 w-4 text-primary shrink-0" />
                        <span className="font-semibold">{plan.userSeats} seat {plan.userSeats === 1 ? "license" : "licenses"}</span>
                      </div>
                    </div>

                    <div className="flex-1 border-t border-border/40 pt-4 mb-6">
                      <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-3">Included Policies:</p>
                      <ul className="space-y-2 text-xs text-muted-foreground leading-relaxed">
                        {plan.features.map((feature) => (
                          <li key={feature} className="flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      {isCurrentPlan && (
                        <Button disabled className="w-full rounded-full text-xs font-bold border border-border">
                          Active Plan
                        </Button>
                      )}
                      {!isCurrentPlan && currentSubscription && canOnlyUpgrade && (
                        <Button
                          onClick={() => handleUpgrade(plan.id)}
                          disabled={isUpgrading === plan.id || !canManageSubscription}
                          className="w-full rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-md h-9 text-xs"
                        >
                          {isUpgrading === plan.id && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                          Upgrade Plan
                        </Button>
                      )}
                      {!isCurrentPlan && (!currentSubscription || !canOnlyUpgrade) && (
                        <Button
                          onClick={() => handleSubscribe(plan.id)}
                          disabled={(isSubscribing && selectedPlanId === plan.id) || !canManageSubscription}
                          className="w-full rounded-full h-9 text-xs font-bold"
                          variant={isCurrentPlan ? "outline" : "default"}
                        >
                          {isSubscribing && selectedPlanId === plan.id && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                          {!currentSubscription ? "Choose Tier" : "Downgrade Tier"}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Billing History Card */}
        {billingHistory.length > 0 && (
          <Card className="rounded-3xl border border-border bg-card/65 shadow-xl backdrop-blur-md overflow-hidden">
            <CardHeader className="border-b border-border bg-muted/20 px-6 py-4">
              <CardTitle className="text-base font-bold text-foreground">Billing Receipts</CardTitle>
              <CardDescription className="text-xs text-muted-foreground">Your recent invoices and subscription payouts</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-border/40 bg-muted/20 uppercase tracking-wider text-[10px] text-muted-foreground">
                      <th className="py-3 px-4 font-semibold">Date</th>
                      <th className="py-3 px-4 font-semibold">Invoice Description</th>
                      <th className="py-3 px-4 font-semibold">Licensing</th>
                      <th className="py-3 px-4 font-semibold text-right">Amount</th>
                      <th className="py-3 px-4 font-semibold text-right">Receipt Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {billingHistory.map((item) => (
                      <tr key={item.id} className="border-b border-border hover:bg-muted/10 transition">
                        <td className="py-3 px-4 font-mono">{new Date(item.date).toLocaleDateString()}</td>
                        <td className="py-3 px-4 text-foreground font-semibold">{item.description}</td>
                        <td className="py-3 px-4 text-muted-foreground">{item.planName} Plan</td>
                        <td className="py-3 px-4 font-bold text-foreground text-right font-mono">${item.amount.toFixed(2)}</td>
                        <td className="py-3 px-4 text-right">
                          <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 py-0.5 rounded font-mono text-[9px]">
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

        {/* Custom Tier Sales */}
        <Card className="rounded-3xl border border-border bg-card/65 shadow-xl backdrop-blur-md overflow-hidden">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="space-y-1">
                <h3 className="font-bold text-foreground text-sm uppercase tracking-wide">Enterprise Custom Plan Need?</h3>
                <p className="text-xs text-muted-foreground">We custom tailor specific seat limits and regulatory audit rules for massive organizations.</p>
              </div>
              <Button variant="outline" className="rounded-full border-border hover:bg-muted text-foreground font-medium h-9 text-xs">
                Contact Enterprise Sales
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Subscription;
