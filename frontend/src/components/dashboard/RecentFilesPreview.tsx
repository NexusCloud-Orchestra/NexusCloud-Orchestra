import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ManagedFile } from '../../services/dashboard.service';
import { ProviderIcon } from '../ui/ProviderIcon';
import { Files, ArrowRight, FileText, CheckCircle2 } from 'lucide-react';
import { Button } from '../ui/button';

interface RecentFilesPreviewProps {
  files: ManagedFile[];
}

export const RecentFilesPreview: React.FC<RecentFilesPreviewProps> = ({ files }) => {
  const navigate = useNavigate();

  const formatBytes = (bytes: number) => {
    if (bytes >= 1024 * 1024 * 1024) {
      return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(0)} MB`;
  };

  const getRelativeTime = (isoString: string) => {
    const diffMin = Math.floor(
      (Date.now() - new Date(isoString).getTime()) / (1000 * 60)
    );
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffMin < 1440) return `${Math.floor(diffMin / 60)}h ago`;
    return `${Math.floor(diffMin / 1440)}d ago`;
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
      {/* Section Header */}
      <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-slate-100 text-slate-700">
            <Files className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-slate-900">Managed Files</h3>
            <p className="text-[11px] text-slate-500">Latest multi-cloud distributed storage objects</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/files')}
          className="text-blue-600 hover:text-blue-700 font-medium text-xs h-7 px-2"
        >
          <span>View all files</span>
          <ArrowRight className="w-3.5 h-3.5 ml-1" />
        </Button>
      </div>

      {/* Files List */}
      <div className="my-2 space-y-2">
        {files.slice(0, 4).map((f) => (
          <div
            key={f.id}
            className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 transition-colors text-xs"
          >
            <div className="flex items-center gap-2.5 min-w-0 pr-2">
              <FileText className="w-4 h-4 text-slate-400 shrink-0" />
              <div className="truncate">
                <span className="font-medium text-slate-900 block truncate text-xs" title={f.name}>
                  {f.name}
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  {formatBytes(f.sizeBytes)} · {getRelativeTime(f.updatedAt)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200 text-[10px] font-medium text-slate-700">
                <ProviderIcon provider={f.provider} size={13} />
                <span className="capitalize">{f.provider}</span>
              </div>
              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-1.5 py-0.5 rounded">
                <CheckCircle2 className="w-2.5 h-2.5" />
                Synced
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
