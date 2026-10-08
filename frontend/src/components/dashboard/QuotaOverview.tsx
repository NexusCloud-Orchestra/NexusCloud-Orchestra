import React, { useState, useEffect } from 'react';
import { CloudProviderConnection } from '../../services/dashboard.service';
import { ProviderIcon } from '../ui/ProviderIcon';
import { HardDrive } from 'lucide-react';

interface QuotaOverviewProps {
  connections: CloudProviderConnection[];
}

export const QuotaOverview: React.FC<QuotaOverviewProps> = ({ connections }) => {
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const formatGb = (bytes: number) => (bytes / (1024 * 1024 * 1024)).toFixed(1);

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
      {/* Section Header */}
      <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-slate-100 text-slate-700">
            <HardDrive className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-slate-900">Quota Overview</h3>
            <p className="text-[11px] text-slate-500">Capacity headroom & threshold limits</p>
          </div>
        </div>
        <span className="text-xs text-slate-500 font-mono">BYOC Limits</span>
      </div>

      {/* Progress Bars with clean Shadcn styling */}
      <div className="my-2 space-y-3.5">
        {connections.map((c) => {
          const usedGb = formatGb(c.quotaUsedBytes);
          const totalGb = formatGb(c.quotaTotalBytes);
          const percentage = Math.round(
            (c.quotaUsedBytes / (c.quotaTotalBytes || 1)) * 100
          );

          return (
            <div key={c.id} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <ProviderIcon provider={c.provider} size={15} />
                  <span className="font-medium text-slate-900">{c.name}</span>
                </div>
                <div className="flex items-center gap-2.5 text-[11px]">
                  <span className="text-slate-500 font-mono">
                    {usedGb} / {totalGb} GB
                  </span>
                  <span className="font-mono font-semibold text-slate-900 w-8 text-right">
                    {percentage}%
                  </span>
                </div>
              </div>

              {/* Clean Shadcn Progress Bar */}
              <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ease-out ${
                    percentage > 85 ? 'bg-amber-500' : 'bg-slate-900'
                  }`}
                  style={{
                    width: animated ? `${percentage}%` : '0%',
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
