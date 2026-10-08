import React from 'react';
import { CloudProviderConnection } from '../../services/dashboard.service';
import { ProviderIcon } from '../ui/ProviderIcon';
import { Activity, CheckCircle2 } from 'lucide-react';
import { Badge } from '../ui/badge';

interface ProviderHealthGridProps {
  connections: CloudProviderConnection[];
}

export const ProviderHealthGrid: React.FC<ProviderHealthGridProps> = ({ connections }) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
      {/* Section Header */}
      <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-slate-100 text-slate-700">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-slate-900">Provider Health</h3>
            <p className="text-[11px] text-slate-500">Direct cloud endpoint operational telemetry</p>
          </div>
        </div>
        <Badge variant="success">All Nominal</Badge>
      </div>

      {/* Status Rows */}
      <div className="my-2 divide-y divide-slate-100">
        {connections.map((c) => (
          <div
            key={c.id}
            className="py-2.5 flex items-center justify-between text-xs hover:bg-slate-50 px-1 rounded-md transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <ProviderIcon provider={c.provider} size={16} />
              <div>
                <span className="font-medium text-slate-900 block text-xs">
                  {c.name}
                </span>
                <span className="text-[10px] font-mono text-slate-500">
                  {c.region} · {c.bucket}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-600">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Connected</span>
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
