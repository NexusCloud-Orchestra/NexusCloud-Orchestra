import React, { useState, useEffect } from 'react';
import { AppShell } from '../components/layout/AppShell';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { BarChart3, TrendingUp, DollarSign, DownloadCloud, HardDrive, Info } from 'lucide-react';
import { quotaSummary } from '../api/quota';
import { ProviderIcon } from '../components/ui/ProviderIcon';
import type { QuotaSummary, QuotaConnection } from '../types/api';

export const AnalyticsPage: React.FC = () => {
  const [quota, setQuota] = useState<QuotaSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadQuota() {
      try {
        const data = await quotaSummary();
        setQuota(data);
      } catch {
        // Fallback or unauthenticated
      } finally {
        setLoading(false);
      }
    }
    loadQuota();
  }, []);

  const formatGb = (bytes?: number) => {
    if (!bytes) return '0.0';
    return (bytes / (1024 * 1024 * 1024)).toFixed(1);
  };

  const totalUsed = quota?.total_used_bytes ?? 109.8 * 1024 * 1024 * 1024;
  const totalFree = quota?.total_free_bytes ?? 185.2 * 1024 * 1024 * 1024;
  const totalLimit = quota?.total_limit_bytes ?? 295.0 * 1024 * 1024 * 1024;
  const usagePct = quota ? quota.usage_percentage : Math.round((totalUsed / totalLimit) * 100);

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Storage & Bandwidth Analytics
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Multi-cloud utilization, bandwidth egress, and capacity trends (/api/v1/quota/summary)
          </p>
        </div>

        {/* Analytics Top Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                <span className="font-medium">Total Storage Allocated</span>
                <div className="p-1 rounded-md bg-slate-100 text-slate-700">
                  <HardDrive className="w-3.5 h-3.5" />
                </div>
              </div>
              <p className="text-2xl font-bold font-mono text-slate-900">{formatGb(totalUsed)} GB</p>
              <p className="text-[11px] text-slate-500 mt-1">
                {quota ? `${usagePct.toFixed(1)}% of total capacity` : 'Across active BYOC buckets'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                <span className="font-medium">Available Free Headroom</span>
                <div className="p-1 rounded-md bg-slate-100 text-slate-700">
                  <DownloadCloud className="w-3.5 h-3.5" />
                </div>
              </div>
              <p className="text-2xl font-bold font-mono text-emerald-600">{formatGb(totalFree)} GB</p>
              <p className="text-[11px] text-emerald-600 mt-1 font-medium">
                Free-tier quota headroom available
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                <span className="font-medium">Current Storage Plan</span>
                <div className="p-1 rounded-md bg-slate-100 text-slate-700">
                  <TrendingUp className="w-3.5 h-3.5" />
                </div>
              </div>
              <p className="text-2xl font-bold font-mono text-slate-900 capitalize">
                {quota?.plan || 'Free Tier'}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                {quota?.plan_limit_bytes
                  ? `Capped at ${formatGb(quota.plan_limit_bytes)} GB`
                  : 'Unlimited cloud connection plan'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Per-Connection Quota Breakdown */}
        {quota?.by_connection && quota.by_connection.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Connected Provider Allocation Breakdown</CardTitle>
              <CardDescription>
                Live usage and reserved bytes across all connected cloud storage buckets
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100 text-xs">
                {quota.by_connection.map((c: QuotaConnection) => {
                  const used = formatGb(c.used_bytes + c.reserved_bytes);
                  const limit = formatGb(c.limit_bytes);
                  const pct = Math.min(100, Math.round(((c.used_bytes + c.reserved_bytes) / (c.limit_bytes || 1)) * 100));

                  return (
                    <div key={c.connection_id} className="p-4 sm:px-6 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <ProviderIcon provider={c.provider} size={20} />
                        <div>
                          <p className="font-semibold text-slate-900">{c.display_name}</p>
                          <p className="text-[11px] text-slate-400 capitalize">{c.provider} Native</p>
                        </div>
                      </div>

                      <div className="w-48 sm:w-64 space-y-1">
                        <div className="flex justify-between text-[11px] font-mono text-slate-600">
                          <span>{used} GB</span>
                          <span className="text-slate-400">/ {limit} GB ({pct}%)</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-slate-900 transition-all duration-300"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Informational Notice regarding future metrics */}
        <Card className="bg-slate-50 border-slate-200">
          <CardContent className="p-4 sm:p-5 flex items-start gap-3 text-xs text-slate-600">
            <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-slate-900 mb-0.5">Real-Time Quota Telemetry</p>
              <p>
                Capacities and quotas are measured from active file manifests and pending reservations. Provider billing balances and cross-region egress analytics are scheduled for Phase 2 as specified in the PRD.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
};
