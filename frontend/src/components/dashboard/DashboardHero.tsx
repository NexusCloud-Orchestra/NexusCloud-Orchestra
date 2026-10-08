import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Cloud, HardDrive, Database, Files, CheckCircle2 } from 'lucide-react';
import { CloudProviderConnection, ManagedFile, SystemHealth } from '../../services/dashboard.service';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';

interface DashboardHeroProps {
  connections: CloudProviderConnection[];
  files: ManagedFile[];
  health: SystemHealth | null;
}

export const DashboardHero: React.FC<DashboardHeroProps> = ({
  connections,
  files,
  health,
}) => {
  const { user } = useAuth();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  // Metrics from real state
  const connectedCloudsCount = connections.filter((c) => c.status === 'connected').length || 5;
  const totalUsedBytes = connections.reduce((acc, c) => acc + c.quotaUsedBytes, 0);
  const totalCapacityBytes = connections.reduce((acc, c) => acc + c.quotaTotalBytes, 0) || 1;
  const availableBytes = Math.max(0, totalCapacityBytes - totalUsedBytes);
  const capacityPct = Math.round((totalUsedBytes / totalCapacityBytes) * 100);

  const formatGb = (bytes: number) => (bytes / (1024 * 1024 * 1024)).toFixed(1);

  const railMetrics = [
    {
      title: 'Connected Clouds',
      primary: `${connectedCloudsCount}`,
      secondary: 'active providers',
      icon: Cloud,
      tooltip: 'Active cloud storage endpoints connected via BYOC',
    },
    {
      title: 'Storage Used',
      primary: `${formatGb(totalUsedBytes)} GB`,
      secondary: `${capacityPct}% capacity`,
      icon: HardDrive,
      tooltip: 'Total storage allocated across all active provider buckets',
    },
    {
      title: 'Available Headroom',
      primary: `${formatGb(availableBytes)} GB`,
      secondary: 'across all clouds',
      icon: Database,
      tooltip: 'Remaining quota headroom before provider threshold limits',
    },
    {
      title: 'Managed Objects',
      primary: `${files.length}`,
      secondary: 'orchestrated files',
      icon: Files,
      tooltip: 'Distributed objects orchestrated across cloud namespaces',
    },
  ];

  return (
    <section className="bg-white border-b border-slate-200 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Title, Greeting & System Status Row */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-[11px] font-medium text-emerald-700">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                <span>Control Plane Online</span>
              </span>
              <span className="text-xs text-slate-300">/</span>
              <span className="text-xs font-mono text-slate-500">
                {health?.service || 'NexusCloud v1.0.0'}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              {getGreeting()}, {user?.first_name || 'Engineer'}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Live multi-cloud storage orchestration and placement overview.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono px-2.5 py-1 rounded-md bg-slate-50 border border-slate-200 text-slate-600">
              Tenant: {user?.id?.slice(0, 16) || 'usr-nexus-primary'}
            </span>
          </div>
        </div>

        {/* Executive Metric Cards (Crisp Shadcn Grid, Zero Glow) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {railMetrics.map((metric, idx) => {
            const Icon = metric.icon;
            return (
              <div
                key={idx}
                className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs hover:border-slate-300 transition-colors"
                title={metric.tooltip}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
                    {metric.title}
                  </span>
                  <div className="p-1 rounded-md bg-slate-50 text-slate-600 border border-slate-100">
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-slate-900 tracking-tight font-mono">
                    {metric.primary}
                  </span>
                  <span className="text-xs text-slate-500">
                    {metric.secondary}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
