import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { authService } from "@/services/authService";
import { settingsService, CompanySettings, AutoApprovalRules, NotificationSettings } from "@/services/settingsService";
import { managerService, AuditInsight } from "@/services/managerService";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2, CheckCircle, LogOut, ShieldCheck, Zap, Bell, ExternalLink } from "lucide-react";

const Settings = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
   const isAdmin = user?.role === "Owner";
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [companySettings, setCompanySettings] = useState<CompanySettings | null>(null);
  const [policyForm, setPolicyForm] = useState({ maxSpendLimit: "", policyNotes: "" });
  const [isSavingPolicy, setIsSavingPolicy] = useState(false);
  const [policyError, setPolicyError] = useState("");
  const [policySuccess, setPolicySuccess] = useState("");
  const [policyInsights, setPolicyInsights] = useState<AuditInsight | null>(null);
   const [autoApprovalRules, setAutoApprovalRules] = useState<AutoApprovalRules | null>(null);
   const [isSavingAutoApproval, setIsSavingAutoApproval] = useState(false);
   const [autoApprovalError, setAutoApprovalError] = useState("");
   const [autoApprovalSuccess, setAutoApprovalSuccess] = useState("");
   const [notificationSettings, setNotificationSettings] = useState<NotificationSettings | null>(null);
   const [isSavingNotification, setIsSavingNotification] = useState(false);
   const [notificationError, setNotificationError] = useState("");
   const [notificationSuccess, setNotificationSuccess] = useState("");


  useEffect(() => {
    const fetchSettings = async () => {
      const result = await settingsService.getCompanySettings();
      if (result.success && result.data) {
        setCompanySettings(result.data);
        setPolicyForm({
          maxSpendLimit: String(result.data.maxSpendLimit),
          policyNotes: result.data.policyNotes || "",
        });
      }
    };
    fetchSettings();
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    const fetchPolicyInsights = async () => {
      const result = await managerService.getAuditInsights();
      if (result.success && result.data) {
        setPolicyInsights(result.data);
      }
    };
    fetchPolicyInsights();
  }, [isAdmin]);

   useEffect(() => {
     if (!isAdmin) return;
     const fetchAutoApprovalRules = async () => {
       const result = await settingsService.getAutoApprovalRules();
       if (result.success && result.data) {
         setAutoApprovalRules(result.data);
       }
     };
     fetchAutoApprovalRules();
   }, [isAdmin]);

   useEffect(() => {
     if (!isAdmin) return;
     const fetchNotificationSettings = async () => {
       const result = await settingsService.getNotificationSettings();
       if (result.success && result.data) {
         setNotificationSettings(result.data);
       }
     };
     fetchNotificationSettings();
   }, [isAdmin]);

  useEffect(() => {
    if (location.pathname !== "/settings/policy") return;
    const section = document.getElementById("policy-configuration");
    if (section) {
      section.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [location.pathname]);

  const handleSavePolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    setPolicyError("");
    setPolicySuccess("");
    const limit = parseFloat(policyForm.maxSpendLimit);
    if (isNaN(limit) || limit <= 0) {
      setPolicyError("Max spend limit must be a positive number.");
      return;
    }
    setIsSavingPolicy(true);
    const result = await settingsService.updatePolicy({
      maxSpendLimit: limit,
      policyNotes: policyForm.policyNotes || undefined,
    });
    if (result.success) {
      setPolicySuccess("Policy updated successfully.");
      setCompanySettings((prev) => prev ? { ...prev, maxSpendLimit: limit, policyNotes: policyForm.policyNotes || undefined } : prev);
    } else {
      setPolicyError(result.error || "Failed to update policy.");
    }
    setIsSavingPolicy(false);
  };

   const handleSaveAutoApproval = async (e: React.FormEvent) => {
     e.preventDefault();
     setAutoApprovalError("");
     setAutoApprovalSuccess("");
     if (!autoApprovalRules) return;

     setIsSavingAutoApproval(true);
     const result = await settingsService.updateAutoApprovalRules({
       enabled: autoApprovalRules.enabled,
       maxAmount: autoApprovalRules.maxAmount,
       maxRiskScore: autoApprovalRules.maxRiskScore,
       excludeWeekends: autoApprovalRules.excludeWeekends,
       excludedCategories: autoApprovalRules.excludedCategories,
       minAgeHours: autoApprovalRules.minAgeHours,
     });

     if (result.success) {
       setAutoApprovalSuccess("Auto-approval settings saved.");
     } else {
       setAutoApprovalError(result.error || "Failed to save auto-approval settings.");
     }
     setIsSavingAutoApproval(false);
   };

   const handleSaveNotification = async (e: React.FormEvent) => {
     e.preventDefault();
     setNotificationError("");
     setNotificationSuccess("");
     if (!notificationSettings) return;

     setIsSavingNotification(true);
     const result = await settingsService.updateNotificationSettings({
       emailNotificationsEnabled: notificationSettings.emailNotificationsEnabled,
       slackNotificationsEnabled: notificationSettings.slackNotificationsEnabled,
       slackWebhookUrl: notificationSettings.slackWebhookUrl,
       slackChannel: notificationSettings.slackChannel,
       managerEmail: notificationSettings.managerEmail,
       noReplyEmail: notificationSettings.noReplyEmail,
     });

     if (result.success) {
       setNotificationSuccess("Notification settings saved.");
     } else {
       setNotificationError(result.error || "Failed to save notification settings.");
     }
     setIsSavingNotification(false);
   };


  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmitPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setError("All password fields are required");
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError("New passwords don't match");
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      setError("New password must be at least 8 characters");
      return;
    }

    setIsLoading(true);

    try {
      const result = await authService.changePassword(
        passwordForm.currentPassword,
        passwordForm.newPassword
      );

      if (result.success) {
        setSuccess("Password changed successfully");
        setPasswordForm({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      } else {
        setError(result.error || "Failed to change password");
      }
    } catch (err) {
      setError("An error occurred while changing password");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    if (confirm("Are you sure you want to logout?")) {
      logout();
      navigate("/login");
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-2xl">
        {/* Header */}
        <div className="rounded-[2rem] border border-border/60 bg-card/80 p-6 shadow-sm backdrop-blur">
          <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">Account</p>
          <h1 className="mt-2 text-3xl font-bold text-foreground">Settings</h1>
          <p className="mt-1 text-muted-foreground">Manage your account and preferences.</p>
        </div>

        {/* Profile Info */}
        <Card className="rounded-[2rem] border-border/60 bg-card/85 shadow-sm backdrop-blur">
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>Your account details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium text-foreground">{user?.email}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Role</p>
                <p className="font-medium text-foreground">{user?.role}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Company</p>
                <p className="font-medium text-foreground">{user?.companyName}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Plan Type</p>
                <p className="font-medium text-foreground">{user?.planType}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Change Password */}
        <Card className="rounded-[2rem] border-border/60 bg-card/85 shadow-sm backdrop-blur">
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
            <CardDescription>Update your account password</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitPassword} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">{success}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  placeholder="••••••••"
                  name="currentPassword"
                  value={passwordForm.currentPassword}
                  onChange={handlePasswordChange}
                  disabled={isLoading}
                  className="border-border/50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="••••••••"
                  name="newPassword"
                  value={passwordForm.newPassword}
                  onChange={handlePasswordChange}
                  disabled={isLoading}
                  className="border-border/50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  name="confirmPassword"
                  value={passwordForm.confirmPassword}
                  onChange={handlePasswordChange}
                  disabled={isLoading}
                  className="border-border/50"
                />
              </div>

              <Button type="submit" disabled={isLoading} className="gap-2">
                {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                {isLoading ? "Updating..." : "Update Password"}
              </Button>
            </form>
          </CardContent>
        </Card>

         {/* Policy Configuration – Owner only */}
        {isAdmin && (
          <Card id="policy-configuration" className="rounded-[2rem] border-border/60 bg-card/85 shadow-sm backdrop-blur">
            <CardHeader>
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                <CardTitle>Policy Configuration</CardTitle>
              </div>
              <CardDescription>
                Set the maximum spend limit and policy notes for your organization. These thresholds are used by the risk engine to flag and score expenses.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {companySettings && (
                <p className="text-sm text-muted-foreground mb-4">
                  Current limit: <strong>{companySettings.maxSpendLimit.toLocaleString()}</strong> · Plan: {companySettings.planType}
                </p>
              )}
              <form onSubmit={handleSavePolicy} className="space-y-4">
                {policyError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{policyError}</AlertDescription>
                  </Alert>
                )}
                {policySuccess && (
                  <Alert className="border-green-200 bg-green-50">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">{policySuccess}</AlertDescription>
                  </Alert>
                )}
                <div className="space-y-2">
                  <Label htmlFor="maxSpendLimit">Max Spend Limit per Expense</Label>
                  <Input
                    id="maxSpendLimit"
                    type="number"
                    step="1"
                    min="1"
                    placeholder="e.g. 2000000"
                    value={policyForm.maxSpendLimit}
                    onChange={(e) => setPolicyForm((prev) => ({ ...prev, maxSpendLimit: e.target.value }))}
                    disabled={isSavingPolicy}
                    className="border-border/50"
                  />
                  <p className="text-xs text-muted-foreground">Expenses above this amount will trigger a mandatory policy review flag.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="policyNotes">Policy Notes</Label>
                  <Textarea
                    id="policyNotes"
                    placeholder="Add internal policy guidance visible to reviewers..."
                    value={policyForm.policyNotes}
                    onChange={(e) => setPolicyForm((prev) => ({ ...prev, policyNotes: e.target.value }))}
                    disabled={isSavingPolicy}
                    rows={3}
                    className="border-border/50"
                  />
                </div>
                <Button type="submit" disabled={isSavingPolicy} className="gap-2">
                  {isSavingPolicy && <Loader2 className="h-4 w-4 animate-spin" />}
                  Save Policy
                </Button>
              </form>

              {policyInsights && (
                <div className="mt-8 space-y-4 border-t border-border/50 pt-5">
                  <div>
                    <p className="text-sm font-medium">Policy Trigger Analytics</p>
                    <p className="text-xs text-muted-foreground">Track which policy rules trigger most and how trigger volume changes monthly.</p>
                  </div>

                  <div className="space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Top Triggered Rules</p>
                    {policyInsights.topPolicyTriggers.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No policy rules triggered yet.</p>
                    ) : (
                      policyInsights.topPolicyTriggers.slice(0, 5).map((trigger) => {
                        const maxCount = Math.max(...policyInsights.topPolicyTriggers.map((item) => item.count), 1);
                        return (
                          <div key={trigger.trigger}>
                            <div className="mb-1 flex items-center justify-between text-sm">
                              <span className="font-medium">{trigger.trigger}</span>
                              <span className="text-muted-foreground">{trigger.count}</span>
                            </div>
                            <div className="h-2 w-full overflow-hidden rounded-full bg-secondary/50">
                              <div
                                className="h-full rounded-full bg-primary"
                                style={{ width: `${Math.max((trigger.count / maxCount) * 100, 8)}%` }}
                              />
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Monthly Trigger Volume</p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {policyInsights.monthlyPolicyTriggerTrend.map((month) => (
                        <div key={month.monthLabel} className="rounded-lg border border-border/50 px-3 py-2 text-sm">
                          <p className="text-muted-foreground">{month.monthLabel}</p>
                          <p className="font-semibold">{month.triggeredCount} trigger(s)</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Auto-Approval Rules – Owner only */}
        {isAdmin && autoApprovalRules && (
          <Card className="rounded-[2rem] border-border/60 bg-card/85 shadow-sm backdrop-blur">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                <CardTitle>Auto-Approval Rules</CardTitle>
              </div>
              <CardDescription>
                Automatically approve low-risk expenses without manual review.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveAutoApproval} className="space-y-4">
                {autoApprovalError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{autoApprovalError}</AlertDescription>
                  </Alert>
                )}
                {autoApprovalSuccess && (
                  <Alert className="border-green-200 bg-green-50">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">{autoApprovalSuccess}</AlertDescription>
                  </Alert>
                )}

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Enable Auto-Approval</p>
                    <p className="text-sm text-muted-foreground">Turn on automatic approval for qualifying expenses.</p>
                  </div>
                  <Switch
                    checked={autoApprovalRules.enabled}
                    onCheckedChange={(checked) => setAutoApprovalRules({ ...autoApprovalRules, enabled: checked })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxAmount">Max Amount ($)</Label>
                  <Input
                    id="maxAmount"
                    type="number"
                    value={autoApprovalRules.maxAmount}
                    onChange={(e) => setAutoApprovalRules({ ...autoApprovalRules, maxAmount: Number(e.target.value) })}
                    disabled={isSavingAutoApproval}
                  />
                  <p className="text-xs text-muted-foreground">Expenses at or below this amount are eligible.</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxRiskScore">Max Risk Score</Label>
                  <Input
                    id="maxRiskScore"
                    type="number"
                    value={autoApprovalRules.maxRiskScore}
                    onChange={(e) => setAutoApprovalRules({ ...autoApprovalRules, maxRiskScore: Number(e.target.value) })}
                    disabled={isSavingAutoApproval}
                  />
                  <p className="text-xs text-muted-foreground">Expenses with risk score at or below this are approved.</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="minAgeHours">Minimum Age (hours)</Label>
                  <Input
                    id="minAgeHours"
                    type="number"
                    value={autoApprovalRules.minAgeHours}
                    onChange={(e) => setAutoApprovalRules({ ...autoApprovalRules, minAgeHours: Number(e.target.value) })}
                    disabled={isSavingAutoApproval}
                  />
                  <p className="text-xs text-muted-foreground">Expense must be at least this old before auto-approval.</p>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Exclude Weekends</p>
                    <p className="text-sm text-muted-foreground">Don't auto-approve expenses dated on weekends.</p>
                  </div>
                  <Switch
                    checked={autoApprovalRules.excludeWeekends}
                    onCheckedChange={(checked) => setAutoApprovalRules({ ...autoApprovalRules, excludeWeekends: checked })}
                  />
                </div>

                <Button type="submit" disabled={isSavingAutoApproval} className="gap-2">
                  {isSavingAutoApproval && <Loader2 className="h-4 w-4 animate-spin" />}
                  Save Settings
                </Button>
              </form>
           </CardContent>
         </Card>
       )}

       {/* Notification Settings – Owner only */}
       {isAdmin && notificationSettings && (
         <Card className="rounded-[2rem] border-border/60 bg-card/85 shadow-sm backdrop-blur">
           <CardHeader>
             <div className="flex items-center gap-2">
               <Bell className="h-5 w-5 text-primary" />
               <CardTitle>Notification Settings</CardTitle>
             </div>
             <CardDescription>
               Configure email and Slack notifications for your organization.
             </CardDescription>
           </CardHeader>
           <CardContent>
             <form onSubmit={handleSaveNotification} className="space-y-6">
               {notificationError && (
                 <Alert variant="destructive">
                   <AlertCircle className="h-4 w-4" />
                   <AlertDescription>{notificationError}</AlertDescription>
                 </Alert>
               )}
               {notificationSuccess && (
                 <Alert className="border-green-200 bg-green-50">
                   <CheckCircle className="h-4 w-4 text-green-600" />
                   <AlertDescription className="text-green-800">{notificationSuccess}</AlertDescription>
                 </Alert>
               )}

               {/* Email Notifications */}
               <div className="space-y-4">
                 <h3 className="text-lg font-semibold flex items-center gap-2">
                   <span className="h-px flex-1 bg-border"></span>
                   Email Notifications
                   <span className="h-px flex-1 bg-border"></span>
                 </h3>

                 <div className="flex items-center justify-between">
                   <div>
                     <p className="font-medium">Enable Email Notifications</p>
                     <p className="text-sm text-muted-foreground">Send automated emails for expense events.</p>
                   </div>
                   <Switch
                     checked={notificationSettings.emailNotificationsEnabled}
                     onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, emailNotificationsEnabled: checked })}
                   />
                 </div>

                 <div className="space-y-2">
                   <Label htmlFor="managerEmail">Manager Notification Email</Label>
                   <Input
                     id="managerEmail"
                     type="email"
                     placeholder="manager@company.com"
                     value={notificationSettings.managerEmail || ""}
                     onChange={(e) => setNotificationSettings({ ...notificationSettings, managerEmail: e.target.value })}
                     disabled={isSavingNotification}
                   />
                   <p className="text-xs text-muted-foreground">
                     Weekly expense digest and high-priority alerts sent to this address.
                   </p>
                 </div>

                 <div className="space-y-2">
                   <Label htmlFor="noReplyEmail">No-Reply Sender Email</Label>
                   <Input
                     id="noReplyEmail"
                     type="email"
                     placeholder="noreply@company.com"
                     value={notificationSettings.noReplyEmail || ""}
                     onChange={(e) => setNotificationSettings({ ...notificationSettings, noReplyEmail: e.target.value })}
                     disabled={isSavingNotification}
                   />
                   <p className="text-xs text-muted-foreground">
                     From address for automated notifications (default: noreply@aiaudit.app).
                   </p>
                 </div>
               </div>

               {/* Slack Notifications */}
               <div className="space-y-4">
                 <h3 className="text-lg font-semibold flex items-center gap-2">
                   <span className="h-px flex-1 bg-border"></span>
                   Slack Integration
                   <span className="h-px flex-1 bg-border"></span>
                 </h3>

                 <div className="flex items-center justify-between">
                   <div>
                     <p className="font-medium">Enable Slack Notifications</p>
                     <p className="text-sm text-muted-foreground">Post anomaly alerts and digests to Slack.</p>
                   </div>
                   <Switch
                     checked={notificationSettings.slackNotificationsEnabled}
                     onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, slackNotificationsEnabled: checked })}
                   />
                 </div>

                 <div className="space-y-2">
                   <Label htmlFor="slackWebhookUrl">Incoming Webhook URL</Label>
                   <Input
                     id="slackWebhookUrl"
                     type="url"
                     placeholder="https://hooks.slack.com/services/..."
                     value={notificationSettings.slackWebhookUrl || ""}
                     onChange={(e) => setNotificationSettings({ ...notificationSettings, slackWebhookUrl: e.target.value })}
                     disabled={isSavingNotification}
                   />
                   <p className="text-xs text-muted-foreground">
                     Create an <strong>Incoming Webhook</strong> in your Slack workspace and paste the URL here.
                     <a href="https://api.slack.com/messaging/webhooks" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline ml-1">
                       Learn more <ExternalLink className="h-3 w-3" />
                     </a>
                   </p>
                 </div>

                 <div className="space-y-2">
                   <Label htmlFor="slackChannel">Default Channel</Label>
                   <Input
                     id="slackChannel"
                     placeholder="#expense-alerts or @username"
                     value={notificationSettings.slackChannel || ""}
                     onChange={(e) => setNotificationSettings({ ...notificationSettings, slackChannel: e.target.value })}
                     disabled={isSavingNotification}
                   />
                   <p className="text-xs text-muted-foreground">
                     Slack channel or user to receive notifications (e.g., #finance or @manager).
                   </p>
                 </div>

                 <div className="space-y-2">
                   <Label htmlFor="slackTeamId">Slack Team ID</Label>
                   <Input
                     id="slackTeamId"
                     placeholder="T1234567890"
                     value={notificationSettings.slackTeamId || ""}
                     onChange={(e) => setNotificationSettings({ ...notificationSettings, slackTeamId: e.target.value })}
                     disabled={isSavingNotification}
                   />
                   <p className="text-xs text-muted-foreground">
                     Your Slack workspace ID (starts with "T"). Required for slash commands.
                     <a href="https://api.slack.com/methods/team.info" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline ml-1">
                       Find your Team ID <ExternalLink className="h-3 w-3" />
                     </a>
                   </p>
                 </div>

                 <div className="space-y-2">
                   <Label htmlFor="slackUserEmailMappings">Slack User → Email Mappings (JSON)</Label>
                   <Textarea
                     id="slackUserEmailMappings"
                     placeholder='{"U12345":"manager@company.com","U67890":"approver@company.com"}'
                     value={notificationSettings.slackUserEmailMappings || ""}
                     onChange={(e) => setNotificationSettings({ ...notificationSettings, slackUserEmailMappings: e.target.value })}
                     disabled={isSavingNotification}
                     rows={4}
                   />
                   <p className="text-xs text-muted-foreground">
                     Map Slack user IDs to AiAudit email addresses for slash command approvals.
                   </p>
                 </div>
               </div>

               <Button type="submit" disabled={isSavingNotification} className="gap-2">
                 {isSavingNotification && <Loader2 className="h-4 w-4 animate-spin" />}
                 Save Settings
               </Button>
             </form>
           </CardContent>
         </Card>
       )}

       {/* Danger Zone */}
        <Card className="rounded-[2rem] border-destructive/40 bg-destructive/5 shadow-sm backdrop-blur">
          <CardHeader>
            <CardTitle className="text-destructive">Session</CardTitle>
            <CardDescription>Logout and session management</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="destructive"
              onClick={handleLogout}
              className="gap-2"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Settings;
