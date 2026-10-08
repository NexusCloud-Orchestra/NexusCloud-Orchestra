import React, { useState } from 'react';
import { ProviderIcon } from '../ui/ProviderIcon';
import { CloudProviderConnection } from '../../services/dashboard.service';
import { Sheet } from '../ui/sheet';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import {
  Layers,
  CheckCircle2,
  ExternalLink,
  RefreshCw,
  HardDrive,
  Database,
  ArrowRight,
  Shield,
  Activity,
  Radio,
} from 'lucide-react';

interface CloudTopologyMapProps {
  connections: CloudProviderConnection[];
}

interface ProviderNodeConfig {
  id: string;
  provider: 'aws' | 'gcp' | 'azure' | 'r2' | 'b2';
  name: string;
  subname: string;
  xPercent: number;
  yPercent: number;
}

export const CloudTopologyMap: React.FC<CloudTopologyMapProps> = ({ connections }) => {
  const [hoveredProvider, setHoveredProvider] = useState<string | null>(null);
  const [selectedConnection, setSelectedConnection] = useState<CloudProviderConnection | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);

  const providerNodes: ProviderNodeConfig[] = [
    {
      id: 'aws',
      provider: 'aws',
      name: 'AWS S3',
      subname: 'Primary Archive',
      xPercent: 70,
      yPercent: 22,
    },
    {
      id: 'gcp',
      provider: 'gcp',
      name: 'Google Cloud Storage',
      subname: 'APAC BigQuery Colocated',
      xPercent: 16,
      yPercent: 44,
    },
    {
      id: 'azure',
      provider: 'azure',
      name: 'Azure Blob',
      subname: 'Cold Storage Tier',
      xPercent: 82,
      yPercent: 54,
    },
    {
      id: 'r2',
      provider: 'r2',
      name: 'Cloudflare R2',
      subname: 'Zero-Egress Distribution',
      xPercent: 26,
      yPercent: 78,
    },
    {
      id: 'b2',
      provider: 'b2',
      name: 'Backblaze B2',
      subname: 'Long-term Vault',
      xPercent: 68,
      yPercent: 80,
    },
  ];

  const hubX = 50;
  const hubY = 48;

  const handleTestHandshake = (id: string) => {
    setTestingId(id);
    setTimeout(() => setTestingId(null), 1000);
  };

  const formatGb = (bytes: number) => (bytes / (1024 * 1024 * 1024)).toFixed(1);

  return (
    <section className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-xs relative overflow-hidden">
      {/* Topology Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-slate-100 text-slate-700">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-900 tracking-tight">
              Cloud Infrastructure Topology
            </h2>
            <p className="text-xs text-slate-500">
              Live multi-cloud orchestration control plane
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <Badge variant="success" className="px-2.5 py-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
            <span>5 Active Endpoints</span>
          </Badge>
          <span className="text-slate-300 hidden sm:inline">·</span>
          <span className="text-slate-500 hidden sm:inline text-xs">
            Click node to inspect
          </span>
        </div>
      </div>

      {/* Interactive SVG Topology Canvas */}
      <div className="relative w-full h-[380px] sm:h-[420px] my-2 select-none overflow-hidden">
        {/* SVG Interconnect Lines (Zero Glow, Clean Crisp Lines) */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          {providerNodes.map((node) => {
            const isHovered = hoveredProvider === node.id;
            const midX = (hubX + node.xPercent) / 2 + (node.xPercent > hubX ? -3 : 3);
            const midY = (hubY + node.yPercent) / 2 + (node.yPercent > hubY ? -4 : 4);
            const pathD = `M ${hubX} ${hubY} Q ${midX} ${midY} ${node.xPercent} ${node.yPercent}`;

            return (
              <g key={`path-${node.id}`}>
                {/* Background path line */}
                <path
                  d={pathD}
                  fill="none"
                  stroke={isHovered ? '#2563EB' : '#CBD5E1'}
                  strokeWidth={isHovered ? '0.75' : '0.4'}
                  strokeDasharray={isHovered ? 'none' : '1.5 1.5'}
                  strokeLinecap="round"
                  className="transition-all duration-200"
                />
              </g>
            );
          })}
        </svg>

        {/* Central NexusCloud Control Node (Crisp Normal Node, Zero Glow) */}
        <div
          className="absolute transform -translate-x-1/2 -translate-y-1/2 z-20 group"
          style={{ left: `${hubX}%`, top: `${hubY}%` }}
        >
          <div className="relative flex items-center justify-center">
            {/* Crisp Slate Circular Core */}
            <div className="w-11 h-11 rounded-full bg-slate-900 border-2 border-white shadow-md flex items-center justify-center text-white transition-transform duration-200 group-hover:scale-105">
              <Radio className="w-5 h-5 text-white" />
            </div>
          </div>
          <div className="mt-2 text-center whitespace-nowrap">
            <span className="text-xs font-semibold text-slate-900 block">NexusCloud</span>
            <span className="text-[10px] text-slate-500 uppercase font-medium tracking-wider">
              Control Plane
            </span>
          </div>
        </div>

        {/* Provider Node Cards (Shadcn Card Styling, Zero Glow) */}
        {providerNodes.map((node) => {
          const conn = connections.find((c) => c.provider === node.provider);
          const isHovered = hoveredProvider === node.id;
          const usedGb = conn ? formatGb(conn.quotaUsedBytes) : '12.4';
          const totalGb = conn ? formatGb(conn.quotaTotalBytes) : '50.0';

          return (
            <div
              key={node.id}
              style={{ left: `${node.xPercent}%`, top: `${node.yPercent}%` }}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 z-20"
              onMouseEnter={() => setHoveredProvider(node.id)}
              onMouseLeave={() => setHoveredProvider(null)}
              onClick={() => setSelectedConnection(conn || null)}
            >
              <div
                className={`w-36 sm:w-44 p-3 rounded-lg bg-white border transition-all duration-150 cursor-pointer text-left ${
                  isHovered
                    ? 'border-blue-600 shadow-md -translate-y-0.5'
                    : 'border-slate-200 shadow-xs hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <div className="flex items-center gap-1.5">
                    <ProviderIcon provider={node.provider} size={16} />
                    <span className="text-xs font-semibold text-slate-900 truncate">
                      {node.name}
                    </span>
                  </div>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0" />
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-500">
                  <span className="truncate max-w-[85px]">{conn?.bucket || 'bucket-vault'}</span>
                  <span className="font-mono font-medium text-slate-900">
                    {usedGb} GB
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Provider Details Sheet (Opened on click) */}
      <Sheet
        isOpen={Boolean(selectedConnection)}
        onClose={() => setSelectedConnection(null)}
        title={selectedConnection ? selectedConnection.name : 'Cloud Provider Details'}
        description="BYOC connection parameters and storage utilization"
      >
        {selectedConnection && (
          <div className="space-y-5 text-xs text-slate-600">
            <div className="flex items-center justify-between p-3.5 rounded-lg bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-3">
                <ProviderIcon provider={selectedConnection.provider} size={24} />
                <div>
                  <h3 className="text-xs font-semibold text-slate-900">
                    {selectedConnection.name}
                  </h3>
                  <span className="text-[11px] font-mono text-slate-500">
                    {selectedConnection.region}
                  </span>
                </div>
              </div>
              <Badge variant="success">Connected</Badge>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold text-slate-900 text-xs uppercase tracking-wider">
                Storage Allocation
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-white rounded-lg border border-slate-200">
                  <span className="text-[11px] text-slate-500 block mb-0.5">Used Storage</span>
                  <span className="text-base font-bold text-slate-900 font-mono">
                    {formatGb(selectedConnection.quotaUsedBytes)} GB
                  </span>
                </div>
                <div className="p-3 bg-white rounded-lg border border-slate-200">
                  <span className="text-[11px] text-slate-500 block mb-0.5">Total Quota</span>
                  <span className="text-base font-bold text-slate-900 font-mono">
                    {formatGb(selectedConnection.quotaTotalBytes)} GB
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold text-slate-900 text-xs uppercase tracking-wider">
                Connection Parameters
              </h4>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5 font-mono text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-500">Bucket:</span>
                  <span className="text-slate-900 font-medium">{selectedConnection.bucket}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Protocol:</span>
                  <span className="text-slate-900">{selectedConnection.protocol}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Last Checksum Sync:</span>
                  <span className="text-slate-900">Synchronized</span>
                </div>
              </div>
            </div>

            <div className="pt-3 flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                disabled={testingId === selectedConnection.id}
                onClick={() => handleTestHandshake(selectedConnection.id)}
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 mr-1.5 ${
                    testingId === selectedConnection.id ? 'animate-spin' : ''
                  }`}
                />
                {testingId === selectedConnection.id ? 'Verifying…' : 'Test Handshake'}
              </Button>
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => setSelectedConnection(null)}
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </Sheet>

      {/* Footer Provider Legend */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3.5 border-t border-slate-100 text-xs">
        <div className="flex flex-wrap items-center gap-4 sm:gap-6">
          {providerNodes.map((n) => (
            <button
              key={n.id}
              onClick={() => {
                const conn = connections.find((c) => c.provider === n.provider);
                setSelectedConnection(conn || null);
              }}
              onMouseEnter={() => setHoveredProvider(n.id)}
              onMouseLeave={() => setHoveredProvider(null)}
              className="flex items-center gap-1.5 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
            >
              <ProviderIcon provider={n.provider} size={14} />
              <span className="font-medium text-xs">{n.name}</span>
            </button>
          ))}
        </div>
        <span className="text-[11px] text-slate-500">
          Direct BYOC Gateway Handshake
        </span>
      </div>
    </section>
  );
};
