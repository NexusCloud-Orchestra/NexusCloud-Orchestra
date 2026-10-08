import React, { useState } from 'react';
import { AppShell } from '../components/layout/AppShell';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import {
  Shield,
  Key,
  User,
  LogOut,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Trash2,
  Lock,
} from 'lucide-react';
import { changePassword, deleteAccount } from '../api/auth';

export const SettingsPage: React.FC = () => {
  const { user, logout, refreshSession, simulateExpireToken } = useAuth();
  const navigate = useNavigate();

  // Session tools state
  const [refreshStatus, setRefreshStatus] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Change password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordStatus, setPasswordStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Delete account state
  const [deletePass, setDeletePass] = useState('');
  const [deleteStatus, setDeleteStatus] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDeleteModal, setConfirmDeleteModal] = useState(false);

  const handleTestRefresh = async () => {
    setIsRefreshing(true);
    setRefreshStatus('Executing POST /api/v1/auth/refresh...');
    try {
      const ok = await refreshSession();
      if (ok) {
        setRefreshStatus('Success! Session refreshed with new access token and rotated refresh token.');
      } else {
        setRefreshStatus('Refresh failed: Token expired or revoked.');
      }
    } catch (err: any) {
      setRefreshStatus(err?.message || 'Refresh error');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordStatus(null);
    if (!currentPassword || !newPassword) return;
    if (newPassword.length < 8) {
      setPasswordStatus({ type: 'error', message: 'New password must be at least 8 characters' });
      return;
    }

    setIsChangingPassword(true);
    try {
      const res = await changePassword({
        current_password: currentPassword,
        new_password: newPassword,
      });
      setPasswordStatus({
        type: 'success',
        message: res.message || 'Password updated. Please sign in again.',
      });
      setCurrentPassword('');
      setNewPassword('');
      setTimeout(() => {
        logout().then(() => navigate('/login'));
      }, 2000);
    } catch (err: any) {
      setPasswordStatus({ type: 'error', message: err?.message || 'Failed to update password' });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeleteStatus(null);
    if (!deletePass) return;

    setIsDeleting(true);
    try {
      await deleteAccount(deletePass);
      navigate('/login');
    } catch (err: any) {
      setDeleteStatus(err?.message || 'Failed to delete account');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Settings & Security
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Authenticated account profile, session credentials, and cryptographic integrity
          </p>
        </div>

        {/* User Account Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-slate-100 text-slate-700">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <CardTitle>User Account Information</CardTitle>
                  <CardDescription>Primary identity and credential routing</CardDescription>
                </div>
              </div>
              <Badge variant="success">Active</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="text-slate-500 block mb-1">Full Name</label>
                <p className="font-semibold text-sm text-slate-900">
                  {user ? `${user.first_name} ${user.last_name}` : '—'}
                </p>
              </div>
              <div>
                <label className="text-slate-500 block mb-1">Email Address</label>
                <p className="font-semibold text-sm text-slate-900">{user?.email || '—'}</p>
              </div>
              <div>
                <label className="text-slate-500 block mb-1">Account Tenant ID</label>
                <p className="font-mono text-xs text-slate-500">{user?.id || '—'}</p>
              </div>
              <div>
                <label className="text-slate-500 block mb-1">Current Plan</label>
                <p className="font-medium text-xs text-slate-900 capitalize">
                  {user?.plan || 'Free Tier'}
                </p>
              </div>
              <div>
                <label className="text-slate-500 block mb-1">Token Strategy</label>
                <p className="font-medium text-xs text-blue-600">In-Memory Access Token + Session Refresh</p>
              </div>
              <div>
                <label className="text-slate-500 block mb-1">Created At</label>
                <p className="font-mono text-xs text-slate-500">
                  {user?.created_at ? new Date(user.created_at).toLocaleDateString() : '—'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Password Management Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-slate-100 text-slate-700">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>
                  Update your authentication credentials (/api/v1/auth/change-password)
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleChangePassword} className="space-y-4 max-w-md text-xs">
              {passwordStatus && (
                <div
                  className={`p-3 rounded-lg border text-xs ${
                    passwordStatus.type === 'success'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-rose-50 border-rose-200 text-rose-700'
                  }`}
                >
                  {passwordStatus.message}
                </div>
              )}

              <div>
                <label className="block text-slate-700 font-medium mb-1.5">Current Password</label>
                <Input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••••••"
                  disabled={isChangingPassword}
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1.5">New Password (min 8 chars)</label>
                <Input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••••••"
                  disabled={isChangingPassword}
                />
              </div>

              <Button type="submit" disabled={isChangingPassword}>
                {isChangingPassword ? 'Updating Password…' : 'Update Password'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Session & Verification Tools Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-slate-100 text-slate-700">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <CardTitle>Authentication & Session Diagnostic Tools</CardTitle>
                  <CardDescription>Verify session refresh and token survival</CardDescription>
                </div>
              </div>
              <Badge variant="outline">Live Contracts</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-slate-500">
              Test token rotation, session survival, and logout against the backend API.
            </p>

            <div className="flex flex-wrap gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleTestRefresh}
                disabled={isRefreshing}
                className="gap-2"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>Test Refresh Token</span>
              </Button>

              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  simulateExpireToken();
                  setRefreshStatus('In-memory token invalidated. Next authenticated request will trigger coordinated refresh retry.');
                }}
                className="gap-2"
              >
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Simulate Expired Access Token</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => logout().then(() => navigate('/login'))}
                className="gap-2"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </Button>
            </div>

            {refreshStatus && (
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs font-mono text-slate-700">
                {refreshStatus}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Danger Zone: Account Deletion (BRD 11.1) */}
        <Card className="border-rose-200">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-rose-50 text-rose-700">
                <Trash2 className="w-4 h-4" />
              </div>
              <div>
                <CardTitle className="text-rose-900">Danger Zone — Delete Account</CardTitle>
                <CardDescription>
                  Permanently erase account, credentials, and connection metadata (BRD 11.1). Cloud objects must be deleted first.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            {deleteStatus && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                {deleteStatus}
              </div>
            )}

            <form onSubmit={handleDeleteAccount} className="max-w-md space-y-3">
              <div>
                <label className="block text-slate-700 font-medium mb-1.5">
                  Confirm Password to Permanently Delete Account
                </label>
                <Input
                  type="password"
                  required
                  value={deletePass}
                  onChange={(e) => setDeletePass(e.target.value)}
                  placeholder="Enter your password"
                  disabled={isDeleting}
                />
              </div>

              <Button
                type="submit"
                variant="destructive"
                disabled={isDeleting || !deletePass}
              >
                {isDeleting ? 'Deleting Account…' : 'Delete Account Permanently'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
};
