import React, { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { adminUserService, TenantUser } from "@/services/adminUserService";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AlertCircle, Copy, Loader2, Users } from "lucide-react";

const ROLES = ["Owner", "Manager", "Member"] as const;

type Role = (typeof ROLES)[number];

const UserManagement = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<TenantUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInviting, setIsInviting] = useState(false);
  const [roleUpdateLoading, setRoleUpdateLoading] = useState<string | null>(null);
  const [statusUpdateLoading, setStatusUpdateLoading] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [invite, setInvite] = useState({
    email: "",
    role: "Member" as Role,
  });
  const [latestInviteUrl, setLatestInviteUrl] = useState("");
  const [roleDrafts, setRoleDrafts] = useState<Record<string, Role>>({});

  useEffect(() => {
    const loadUsers = async () => {
      const result = await adminUserService.getUsers();
      if (result.success && result.data) {
        setUsers(result.data);
        setRoleDrafts(
          result.data.reduce<Record<string, Role>>((acc, user) => {
            acc[user.id] = user.role;
            return acc;
          }, {})
        );
      } else {
        setError(result.error || "Failed to load users");
      }
      setIsLoading(false);
    };

    loadUsers();
  }, []);

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLatestInviteUrl("");

    if (!invite.email.trim()) {
      setError("Email is required");
      return;
    }

    setIsInviting(true);
    const result = await adminUserService.inviteUser(invite);
    if (result.success && result.data) {
      const refreshed = await adminUserService.getUsers();
      if (refreshed.success && refreshed.data) {
        setUsers(refreshed.data);
        setRoleDrafts(
          refreshed.data.reduce<Record<string, Role>>((acc, entry) => {
            acc[entry.id] = entry.role;
            return acc;
          }, {})
        );
      }

      setLatestInviteUrl(result.data.inviteUrl);
      setSuccess(`Invitation created for ${result.data.email}.`);
      setInvite({ email: "", role: "Member" });
    } else {
      setError(result.error || "Failed to invite user");
    }
    setIsInviting(false);
  };

  const handleUpdateRole = async (userId: string) => {
    const role = roleDrafts[userId];
    if (!role) return;

    if (userId === currentUser?.id) {
      setError("You cannot edit your own role.");
      return;
    }

    setError("");
    setSuccess("");
    setRoleUpdateLoading(userId);

    const result = await adminUserService.updateUserRole(userId, { role });
    if (result.success && result.data) {
      setUsers((prev) => prev.map((u) => (u.id === userId ? result.data! : u)));
      setSuccess(`Updated role for ${result.data.email} to ${result.data.role}.`);
    } else {
      setError(result.error || "Failed to update role");
    }

    setRoleUpdateLoading(null);
  };

  const handleToggleStatus = async (target: TenantUser) => {
    if (target.id === currentUser?.id && target.isActive) {
      setError("You cannot deactivate your own account.");
      return;
    }

    setError("");
    setSuccess("");
    setStatusUpdateLoading(target.id);

    const result = await adminUserService.updateUserStatus(target.id, { isActive: !target.isActive });
    if (result.success && result.data) {
      setUsers((prev) => prev.map((u) => (u.id === target.id ? result.data! : u)));
      setSuccess(`${result.data.email} is now ${result.data.isActive ? "active" : "inactive"}.`);
    } else {
      setError(result.error || "Failed to update user status");
    }

    setStatusUpdateLoading(null);
  };

  const copyInviteUrl = async () => {
    if (!latestInviteUrl) return;

    const absolute = `${window.location.origin}${latestInviteUrl}`;
    await navigator.clipboard.writeText(absolute);
    setSuccess("Invite link copied to clipboard.");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-5xl font-sans">
        
        {/* Header Ribbon */}
        <div className="flex items-center gap-4 rounded-3xl border border-border bg-card/65 p-6 shadow-xl backdrop-blur-md">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 text-primary">
            <Users className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <span className="text-[10px] font-mono tracking-[0.28em] text-primary bg-primary/5 px-2 py-0.5 border border-primary/10 rounded uppercase">
              Tenant Admin
            </span>
            <h1 className="text-3xl font-extrabold tracking-tight mt-1.5">User Management</h1>
            <p className="text-sm text-muted-foreground font-sans">
              Create tenant member accounts, generate workspace invite tokens, and manage roles.
            </p>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="rounded-xl">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs font-semibold">{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="rounded-xl border-emerald-500/20 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300">
            <AlertDescription className="text-xs font-bold font-mono">{success}</AlertDescription>
          </Alert>
        )}

        {/* Invite User Card */}
        <Card className="rounded-3xl border border-border bg-card/65 shadow-xl backdrop-blur-md overflow-hidden">
          <CardHeader className="border-b border-border bg-muted/20 px-6 py-4">
            <CardTitle className="text-base font-bold text-foreground">Invite New Colleague</CardTitle>
            <CardDescription className="text-xs text-muted-foreground">Create an instant signup token linked to your tenant directory.</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleInviteUser} className="grid gap-4 md:grid-cols-4">
              <div className="space-y-1.5 md:col-span-3">
                <Label htmlFor="email" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={invite.email}
                  onChange={(e) => setInvite((prev) => ({ ...prev, email: e.target.value }))}
                  placeholder="name@company.com"
                  disabled={isInviting}
                  className="bg-card border-border text-foreground text-xs rounded-xl focus:ring-primary/20 h-10"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Default Role</Label>
                <Select
                  value={invite.role}
                  onValueChange={(value) => setInvite((prev) => ({ ...prev, role: value as Role }))}
                  disabled={isInviting}
                >
                  <SelectTrigger className="bg-card border-border text-foreground text-xs rounded-xl focus:ring-primary/20 h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border border-border text-xs text-popover-foreground">
                    {ROLES.map((role) => (
                      <SelectItem key={role} value={role}>
                        {role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="md:col-span-4 pt-2">
                <Button type="submit" disabled={isInviting} className="rounded-full px-6 bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-md h-10 text-xs gap-2">
                  {isInviting && <Loader2 className="h-4 w-4 animate-spin" />}
                  {isInviting ? "Generating Link..." : "Create Invite Token"}
                </Button>
              </div>

              {latestInviteUrl && (
                <div className="md:col-span-4 rounded-2xl border border-border bg-secondary/30 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Latest Invite Token URL</p>
                  <div className="mt-2 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <p className="text-xs font-mono break-all text-foreground bg-card p-2 rounded-lg border border-border flex-1">{window.location.origin}{latestInviteUrl}</p>
                    <Button type="button" variant="outline" size="sm" className="rounded-full px-4 border-border text-xs h-9 gap-1.5 hover:bg-muted shrink-0" onClick={copyInviteUrl}>
                      <Copy className="h-4 w-4" />
                      Copy Link
                    </Button>
                  </div>
                </div>
              )}
            </form>
          </CardContent>
        </Card>

        {/* Tenant Users List Card */}
        <Card className="rounded-3xl border border-border bg-card/65 shadow-xl backdrop-blur-md overflow-hidden">
          <CardHeader className="border-b border-border bg-muted/20 px-6 py-4">
            <CardTitle className="text-base font-bold text-foreground">Workspace Roster</CardTitle>
            <CardDescription className="text-xs text-muted-foreground">Manage active directory credentials and system roles.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-7 w-7 animate-spin text-primary" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table className="text-xs text-left">
                  <TableHeader>
                    <TableRow className="border-b border-border bg-muted/20 uppercase tracking-wider text-[10px] text-muted-foreground">
                      <th className="py-3 px-4 font-semibold">User Email</th>
                      <th className="py-3 px-4 font-semibold">Current Privilege</th>
                      <th className="py-3 px-4 font-semibold">Revise Privilege</th>
                      <th className="py-3 px-4 font-semibold">Roster Status</th>
                      <th className="py-3 px-4 font-semibold text-right">Actions</th>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id} className="border-b border-border hover:bg-muted/10 transition">
                        <TableCell className="py-3 px-4 font-semibold text-foreground">{user.email}</TableCell>
                        <TableCell className="py-3 px-4 font-mono uppercase font-bold text-primary">{user.role}</TableCell>
                        <TableCell className="py-3 px-4">
                          <Select
                            value={roleDrafts[user.id] || user.role}
                            onValueChange={(value) =>
                              setRoleDrafts((prev) => ({ ...prev, [user.id]: value as Role }))
                            }
                            disabled={roleUpdateLoading === user.id || user.id === currentUser?.id}
                          >
                            <SelectTrigger className="w-[140px] bg-card border-border text-xs rounded-xl h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-popover border border-border text-xs text-popover-foreground">
                              {ROLES.map((role) => (
                                <SelectItem key={role} value={role}>
                                  {role}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="py-3 px-4">
                          <Badge className={`text-[10px] font-mono font-bold tracking-wider px-2 py-0.5 rounded uppercase ${
                            user.isActive ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20" :
                            user.invitationPending ? "bg-amber-500/10 text-amber-600 border border-amber-500/20 animate-pulse" :
                            "bg-muted text-muted-foreground border border-border"
                          }`}>
                            {user.isActive ? "Active Account" : user.invitationPending ? "Invite Unaccepted" : "Suspended"}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-3 px-4 text-right">
                          <div className="flex justify-end gap-1.5">
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={roleUpdateLoading === user.id || user.id === currentUser?.id || (roleDrafts[user.id] || user.role) === user.role}
                              onClick={() => handleUpdateRole(user.id)}
                              className="rounded-full px-4 text-[10px] font-bold border-border h-8 gap-1.5"
                            >
                              {roleUpdateLoading === user.id && <Loader2 className="h-3 w-3 animate-spin" />}
                              Save Privilege
                            </Button>

                            <Button
                              size="sm"
                              variant={user.isActive ? "destructive" : "secondary"}
                              disabled={statusUpdateLoading === user.id || (user.id === currentUser?.id && user.isActive)}
                              onClick={() => handleToggleStatus(user)}
                              className={`rounded-full px-4 text-[10px] font-bold h-8 gap-1.5 ${
                                user.isActive ? "bg-destructive/10 text-destructive border border-destructive/25 hover:bg-destructive hover:text-destructive-foreground" : "bg-primary/10 text-primary border border-primary/25 hover:bg-primary hover:text-primary-foreground"
                              }`}
                            >
                              {statusUpdateLoading === user.id && <Loader2 className="h-3 w-3 animate-spin" />}
                              {user.isActive ? "Suspend Filer" : "Reinstate Filer"}
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
      </div>
    </DashboardLayout>
  );
};

export default UserManagement;
