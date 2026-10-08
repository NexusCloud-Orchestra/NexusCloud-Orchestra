import React, { useState } from 'react';
import { RoutingDecision } from '../../services/dashboard.service';
import { ProviderIcon } from '../ui/ProviderIcon';
import { Route, Check, ArrowRight, FileText, Cpu, Database } from 'lucide-react';
import { Badge } from '../ui/badge';

interface RoutingIntelligenceProps {
  decisions: RoutingDecision[];
}

export const RoutingIntelligence: React.FC<RoutingIntelligenceProps> = ({ decisions }) => {
  const [selectedIdx, setSelectedIdx] = useState(0);

  const activeDecision = decisions[selectedIdx] || decisions[0];

  const formatBytes = (bytes: number) => {
    if (bytes >= 1024 * 1024 * 1024) {
      return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(0)} MB`;
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
      {/* Section Header */}
      <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-slate-100 text-slate-700">
            <Route className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-slate-900">Routing Intelligence</h3>
            <p className="text-[11px] text-slate-500">
              Autonomous placement criteria & tier decisions
            </p>
          </div>
        </div>
        <Badge variant="outline" className="text-slate-700 font-mono text-[10px]">
          Deterministic
        </Badge>
      </div>

      {/* Horizontal Decision Flow Visualization */}
      {activeDecision && (
        <div className="my-3 p-3.5 rounded-lg bg-slate-50 border border-slate-200">
          <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider block mb-2.5">
            Active Placement Pipeline
          </span>

          <div className="flex items-center justify-between gap-2 text-xs">
            {/* 1. File Source Node */}
            <div className="flex items-center gap-2 p-2 rounded-md bg-white border border-slate-200 shadow-2xs min-w-0 max-w-[140px] sm:max-w-[160px]">
              <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <div className="truncate">
                <span className="font-medium text-slate-900 block truncate text-[11px]">
                  {activeDecision.fileName}
                </span>
                <span className="text-[10px] font-mono text-slate-500">
                  {formatBytes(activeDecision.fileSizeBytes)}
                </span>
              </div>
            </div>

            {/* Connecting Flow Arrow */}
            <div className="flex items-center text-slate-400 shrink-0">
              <ArrowRight className="w-3.5 h-3.5" />
            </div>

            {/* 2. NexusCloud Router Node */}
            <div className="flex items-center gap-1.5 p-2 rounded-md bg-slate-900 text-white shadow-2xs shrink-0">
              <Cpu className="w-3.5 h-3.5 text-slate-300" />
              <span className="font-medium text-[11px]">Placement Router</span>
            </div>

            {/* Connecting Flow Arrow */}
            <div className="flex items-center text-slate-400 shrink-0">
              <ArrowRight className="w-3.5 h-3.5" />
            </div>

            {/* 3. Selected Target Provider Node */}
            <div className="flex items-center gap-2 p-2 rounded-md bg-white border border-slate-200 shadow-2xs min-w-0 max-w-[140px] sm:max-w-[160px]">
              <ProviderIcon provider={activeDecision.selectedProvider} size={16} />
              <div className="truncate">
                <span className="font-semibold text-slate-900 block truncate text-[11px] uppercase">
                  {activeDecision.selectedProvider === 'r2' ? 'Cloudflare R2' : activeDecision.selectedProvider}
                </span>
                <span className="text-[10px] font-mono font-medium text-emerald-600">
                  Score {activeDecision.score}
                </span>
              </div>
            </div>
          </div>

          {/* Criteria Checklist */}
          <div className="mt-3 pt-2.5 border-t border-slate-200/80 grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-slate-600">
            <div className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Sufficient capacity</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Zero egress cost</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Policy compatible</span>
            </div>
          </div>
        </div>
      )}

      {/* Decision History Selection Tabs */}
      <div className="space-y-1.5">
        <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider block mb-1">
          Recent Placement Events
        </span>
        <div className="space-y-1.5">
          {decisions.slice(0, 3).map((dec, idx) => (
            <button
              key={dec.id}
              onClick={() => setSelectedIdx(idx)}
              className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition-colors cursor-pointer text-xs border ${
                selectedIdx === idx
                  ? 'bg-slate-100 border-slate-300'
                  : 'bg-white border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2 truncate pr-2">
                <ProviderIcon provider={dec.selectedProvider} size={14} />
                <span className="font-medium text-slate-900 truncate">{dec.fileName}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[10px] font-mono text-slate-500">
                  {formatBytes(dec.fileSizeBytes)}
                </span>
                <span className="font-mono font-semibold text-[10px] text-slate-900">
                  {dec.score}/100
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
