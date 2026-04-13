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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AlertCircle, Copy, Loader2, Users } from "lucide-react";

const ROLES = ["Admin", "Manager", "User"] as const;

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
    role: "User" as Role,
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
      setInvite({ email: "", role: "User" });
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
      <div className="space-y-6 max-w-5xl">
        <div className="rounded-[2rem] border border-border/60 bg-card/80 p-6 shadow-sm backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">Admin</p>
              <h1 className="mt-2 text-3xl font-bold text-foreground">User Management</h1>
            </div>
          </div>
          <p className="mt-4 text-muted-foreground">Create tenant users and manage role assignments.</p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert>
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        <Card className="rounded-[2rem] border-border/60 bg-card/85 shadow-sm backdrop-blur">
          <CardHeader>
            <CardTitle>Invite User</CardTitle>
            <CardDescription>Create an invitation link for a new tenant user.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleInviteUser} className="grid gap-4 md:grid-cols-4">
              <div className="space-y-2 md:col-span-3">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={invite.email}
                  onChange={(e) => setInvite((prev) => ({ ...prev, email: e.target.value }))}
                  placeholder="name@company.com"
                  disabled={isInviting}
                />
              </div>

              <div className="space-y-2">
                <Label>Role</Label>
                <Select
                  value={invite.role}
                  onValueChange={(value) => setInvite((prev) => ({ ...prev, role: value as Role }))}
                  disabled={isInviting}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map((role) => (
                      <SelectItem key={role} value={role}>
                        {role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="md:col-span-4">
                <Button type="submit" disabled={isInviting} className="gap-2">
                  {isInviting && <Loader2 className="h-4 w-4 animate-spin" />}
                  {isInviting ? "Creating Invite..." : "Create Invite"}
                </Button>
              </div>

              {latestInviteUrl && (
                <div className="md:col-span-4 rounded-xl border border-border/60 bg-secondary/30 p-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Latest Invite Link</p>
                  <div className="mt-2 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <p className="text-sm break-all text-foreground">{window.location.origin}{latestInviteUrl}</p>
                    <Button type="button" variant="outline" size="sm" className="gap-2" onClick={copyInviteUrl}>
                      <Copy className="h-4 w-4" />
                      Copy Link
                    </Button>
                  </div>
                </div>
              )}
            </form>
          </CardContent>
        </Card>

        <Card className="rounded-[2rem] border-border/60 bg-card/85 shadow-sm backdrop-blur">
          <CardHeader>
            <CardTitle>Tenant Users</CardTitle>
            <CardDescription>Review users and update role assignments.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-7 w-7 animate-spin text-primary" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Current Role</TableHead>
                      <TableHead>New Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.email}</TableCell>
                        <TableCell>{user.role}</TableCell>
                        <TableCell>
                          <Select
                            value={roleDrafts[user.id] || user.role}
                            onValueChange={(value) =>
                              setRoleDrafts((prev) => ({ ...prev, [user.id]: value as Role }))
                            }
                            disabled={roleUpdateLoading === user.id || user.id === currentUser?.id}
                          >
                            <SelectTrigger className="w-[160px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {ROLES.map((role) => (
                                <SelectItem key={role} value={role}>
                                  {role}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          {user.isActive ? "Active" : user.invitationPending ? "Invite Pending" : "Inactive"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={roleUpdateLoading === user.id || user.id === currentUser?.id || (roleDrafts[user.id] || user.role) === user.role}
                              onClick={() => handleUpdateRole(user.id)}
                              className="gap-2"
                            >
                              {roleUpdateLoading === user.id && <Loader2 className="h-4 w-4 animate-spin" />}
                              Save Role
                            </Button>

                            <Button
                              size="sm"
                              variant={user.isActive ? "destructive" : "secondary"}
                              disabled={statusUpdateLoading === user.id || (user.id === currentUser?.id && user.isActive)}
                              onClick={() => handleToggleStatus(user)}
                              className="gap-2"
                            >
                              {statusUpdateLoading === user.id && <Loader2 className="h-4 w-4 animate-spin" />}
                              {user.isActive ? "Deactivate" : "Activate"}
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
