import React from 'react';
import { ActivityEvent } from '../../services/dashboard.service';
import { ProviderIcon } from '../ui/ProviderIcon';
import { Activity, Upload, RefreshCw, Route, Shield } from 'lucide-react';

interface RecentActivityFeedProps {
  events: ActivityEvent[];
}

export const RecentActivityFeed: React.FC<RecentActivityFeedProps> = ({ events }) => {
  const getEventIcon = (type: ActivityEvent['type']) => {
    switch (type) {
      case 'upload':
        return <Upload className="w-3.5 h-3.5 text-blue-600" />;
      case 'sync':
        return <RefreshCw className="w-3.5 h-3.5 text-emerald-600" />;
      case 'routing':
        return <Route className="w-3.5 h-3.5 text-sky-600" />;
      default:
        return <Shield className="w-3.5 h-3.5 text-slate-700" />;
    }
  };

  const getRelativeTime = (isoString: string) => {
    const diffSec = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
    if (diffSec < 60) return 'Just now';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    return `${Math.floor(diffSec / 86400)}d ago`;
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
      {/* Section Header */}
      <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-slate-100 text-slate-700">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-slate-900">Recent Activity</h3>
            <p className="text-[11px] text-slate-500">Live orchestration event stream</p>
          </div>
        </div>
        <span className="text-[11px] font-mono text-slate-500">Real-Time</span>
      </div>

      {/* Live Event Stream */}
      <div className="my-2 divide-y divide-slate-100">
        {events.map((evt) => (
          <div key={evt.id} className="py-2.5 flex items-start gap-3 text-xs first:pt-1.5 last:pb-1.5">
            <div className="p-1.5 rounded-md bg-slate-50 border border-slate-200 shrink-0 mt-0.5">
              {getEventIcon(evt.type)}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium text-slate-900 truncate">{evt.title}</span>
                <span className="text-[10px] font-mono text-slate-400 shrink-0">
                  {getRelativeTime(evt.timestamp)}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5 truncate">{evt.description}</p>
            </div>

            {evt.provider && (
              <div className="shrink-0 flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200 text-[10px] font-medium text-slate-700">
                <ProviderIcon provider={evt.provider} size={12} />
                <span className="capitalize">{evt.provider}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
