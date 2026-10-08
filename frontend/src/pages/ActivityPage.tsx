import React, { useState, useEffect } from 'react';
import { AppShell } from '../components/layout/AppShell';
import { Card } from '../components/ui/card';
import { TabsList, TabsTrigger } from '../components/ui/tabs';
import { Activity, ShieldCheck, RefreshCw, UploadCloud, Network, Key, HardDrive } from 'lucide-react';
import { auditLogs } from '../api/auth';
import type { AuditLog } from '../types/api';

const ACTION_MAP: Record<string, { title: string; category: string; icon: 'upload' | 'auth' | 'cloud' | 'system' }> = {
  UPLOAD: { title: 'File Object Uploaded', category: 'file', icon: 'upload' },
  UPLOAD_REQUEST: { title: 'Upload Placement Reserved', category: 'file', icon: 'upload' },
  UPLOAD_CANCEL: { title: 'Upload Reservation Cancelled', category: 'file', icon: 'upload' },
  DOWNLOAD: { title: 'Signed Download URL Issued', category: 'file', icon: 'upload' },
  DELETE: { title: 'Storage Object Deleted', category: 'file', icon: 'upload' },
  CONNECT: { title: 'BYOC Cloud Bucket Connected', category: 'cloud', icon: 'cloud' },
  DISCONNECT: { title: 'Cloud Bucket Disconnected', category: 'cloud', icon: 'cloud' },
  LOGIN: { title: 'User Session Authenticated', category: 'auth', icon: 'auth' },
  LOGOUT: { title: 'Session Tokens Revoked', category: 'auth', icon: 'auth' },
  REGISTER: { title: 'Account Registration Created', category: 'auth', icon: 'auth' },
  PASSWORD_CHANGE: { title: 'User Password Changed', category: 'auth', icon: 'auth' },
  PASSWORD_RESET: { title: 'Password Reset Completed', category: 'auth', icon: 'auth' },
  PLAN_CHANGE: { title: 'Subscription Plan Updated', category: 'auth', icon: 'system' },
};

export const ActivityPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [filterType, setFilterType] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLogs() {
      try {
        const res = await auditLogs();
        if (Array.isArray(res) && res.length > 0) {
          setLogs(res);
        }
      } catch {
        // Unauthenticated or offline
      } finally {
        setLoading(false);
      }
    }
    loadLogs();
  }, []);

  const filtered = logs.filter((log) => {
    if (filterType === 'all') return true;
    const meta = ACTION_MAP[log.action];
    return meta?.category === filterType;
  });

  const getEventIcon = (category?: string) => {
    switch (category) {
      case 'file':
        return <UploadCloud className="w-4 h-4 text-blue-600" />;
      case 'cloud':
        return <HardDrive className="w-4 h-4 text-emerald-600" />;
      case 'auth':
        return <Key className="w-4 h-4 text-amber-600" />;
      default:
        return <ShieldCheck className="w-4 h-4 text-slate-700" />;
    }
  };

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Audit Activity & Operations Log
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Cryptographically audited control-plane actions (/api/v1/auth/audit-logs)
          </p>
        </div>

        {/* Filter Bar with Normal Shadcn Tabs */}
        <div className="flex items-center justify-between">
          <TabsList className="overflow-x-auto max-w-full">
            {[
              { id: 'all', label: 'All Events' },
              { id: 'file', label: 'File Operations' },
              { id: 'cloud', label: 'Cloud Connections' },
              { id: 'auth', label: 'Identity & Auth' },
            ].map((t) => (
              <TabsTrigger
                key={t.id}
                active={filterType === t.id}
                onClick={() => setFilterType(t.id)}
                className="text-xs"
              >
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {/* Timeline */}
        <Card className="divide-y divide-slate-100">
          {filtered.map((log) => {
            const meta = ACTION_MAP[log.action] ?? {
              title: log.action.replace(/_/g, ' '),
              category: 'system',
            };

            return (
              <div
                key={log.id}
                className="p-4 sm:px-6 flex items-start gap-4 text-xs hover:bg-slate-50/50 transition-colors"
              >
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 shrink-0 mt-0.5">
                  {getEventIcon(meta.category)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-semibold text-slate-900 text-sm">{meta.title}</h3>
                    <span className="text-xs font-mono text-slate-400">
                      {new Date(log.created_at).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 mt-1">
                    {log.resource_id && (
                      <span className="font-mono text-[11px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">
                        Target: {log.resource_id.slice(0, 16)}…
                      </span>
                    )}
                    {log.ip_address && (
                      <span className="font-mono text-[11px] text-slate-400">IP: {log.ip_address}</span>
                    )}
                    {log.user_agent && (
                      <span className="truncate max-w-xs text-[11px] text-slate-400">
                        {log.user_agent}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {filtered.length === 0 && !loading && (
            <div className="p-12 text-center text-slate-500 text-xs">
              No audit events recorded for the selected filter.
            </div>
          )}
        </Card>
      </div>
    </AppShell>
  );
};
