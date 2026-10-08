import React, { useState, useEffect } from 'react';
import { AppShell } from '../components/layout/AppShell';
import { ProviderIcon } from '../components/ui/ProviderIcon';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import { Select } from '../components/ui/select';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Network, Zap, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { routePreview } from '../api/files';
import type { RoutePreview as RoutePreviewType, RouteCandidate } from '../types/api';

export const RoutingPage: React.FC = () => {
  const [simSizeMb, setSimSizeMb] = useState(500);
  const [simType, setSimType] = useState('read-heavy');
  const [preview, setPreview] = useState<RoutePreviewType | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  const fetchLivePreview = async (sizeMb: number) => {
    if (sizeMb <= 0) return;
    setLoading(true);
    setErrorNotice(null);
    try {
      const bytes = Math.round(sizeMb * 1024 * 1024);
      const res = await routePreview(bytes);
      setPreview(res);
    } catch (err: any) {
      setErrorNotice(err?.message || 'Smart Router live preview requires connected clouds or active session.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchLivePreview(simSizeMb);
    }, 400);
    return () => clearTimeout(timer);
  }, [simSizeMb]);

  const policies = [
    {
      id: 'pol-01',
      title: 'Zero Egress First Policy',
      description: 'Directs read-intensive distribution workloads to zero-egress providers like Cloudflare R2.',
      priority: 'Highest (P0)',
      target: 'r2' as const,
      status: 'Active',
    },
    {
      id: 'pol-02',
      title: 'Regional Compute Proximity',
      description: 'Places datasets within 5ms latency of compute clusters (e.g. GCP BigQuery in asia-east1).',
      priority: 'High (P1)',
      target: 'gcp' as const,
      status: 'Active',
    },
    {
      id: 'pol-03',
      title: 'Deep Cold Vault Archival',
      description: 'Files untouched for >90 days are staged into Backblaze B2 or Azure Archive for 80% cost savings.',
      priority: 'Medium (P2)',
      target: 'b2' as const,
      status: 'Active',
    },
    {
      id: 'pol-04',
      title: 'High-Throughput Ingestion Buffer',
      description: 'Live ingestion streams are routed to AWS S3 multi-part endpoints with SigV4 acceleration.',
      priority: 'Standard (P3)',
      target: 'aws' as const,
      status: 'Active',
    },
  ];

  // Fallback decision when live API is offline
  const fallbackSim = () => {
    if (simType === 'read-heavy') {
      return {
        provider: 'r2' as const,
        name: 'Cloudflare R2',
        reason: 'Zero egress cost fees apply; best for distributed worker access.',
        score: 98,
      };
    }
    if (simType === 'archive') {
      return {
        provider: 'b2' as const,
        name: 'Backblaze B2',
        reason: 'Lowest unit capacity cost ($0.006/GB/mo) for cold data.',
        score: 95,
      };
    }
    return {
      provider: 'aws' as const,
      name: 'AWS S3',
      reason: 'Lowest IOPS write latency and immediate consistency.',
      score: 92,
    };
  };

  const selectedCandidate = preview?.candidates?.find(
    (c) => c.connection_id === preview.selected_connection_id
  );

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Routing Engine & Policies
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Deterministic placement policies optimizing transfer cost, egress fees, and access latency
          </p>
        </div>

        {/* Live Simulator Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-slate-100 text-slate-700">
                  <Zap className="w-4 h-4 text-amber-500" />
                </div>
                <div>
                  <CardTitle>Placement Decision Simulator</CardTitle>
                  <CardDescription>
                    Deterministic route preview calculated via SmartRouter (/api/v1/files/route-preview)
                  </CardDescription>
                </div>
              </div>
              {loading && <Loader2 className="w-4 h-4 animate-spin text-slate-400" />}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-center">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Simulated File Size (MB)
                </label>
                <Input
                  type="number"
                  min={1}
                  value={simSizeMb}
                  onChange={(e) => setSimSizeMb(Math.max(1, Number(e.target.value)))}
                  placeholder="500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Workload Access Profile
                </label>
                <Select
                  value={simType}
                  onChange={(e) => setSimType(e.target.value)}
                >
                  <option value="read-heavy">High Read Egress / CDN Distribution</option>
                  <option value="archive">Cold Regulatory Archival (&gt;90 days)</option>
                  <option value="write-heavy">High-Frequency Write Telemetry</option>
                </Select>
              </div>

              {/* Recommended Target Card */}
              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider block">
                  {preview?.selected_connection_id ? 'API SmartRouter Winner:' : 'Simulated Target:'}
                </span>

                {selectedCandidate ? (
                  <>
                    <div className="flex items-center gap-2 mt-1">
                      <ProviderIcon provider={selectedCandidate.provider} size={18} />
                      <span className="font-semibold text-slate-900 text-sm">
                        {selectedCandidate.display_name}
                      </span>
                      <span className="ml-auto font-mono text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded">
                        Score {(selectedCandidate.score ?? 0).toFixed(2)}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-1.5 leading-normal">
                      Optimal placement based on remaining capacity ({Math.round(selectedCandidate.free_bytes / (1024 * 1024))} MB free), egress, and fit weights.
                    </p>
                  </>
                ) : (
                  (() => {
                    const sim = fallbackSim();
                    return (
                      <>
                        <div className="flex items-center gap-2 mt-1">
                          <ProviderIcon provider={sim.provider} size={18} />
                          <span className="font-semibold text-slate-900 text-sm">{sim.name}</span>
                          <span className="ml-auto font-mono text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded">
                            Score {sim.score}/100
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 mt-1.5 leading-normal">{sim.reason}</p>
                      </>
                    );
                  })()
                )}
              </div>
            </div>

            {/* If blocked notice from API */}
            {preview?.blocked_reason && (
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  <strong>Upload Blocked:</strong> {preview.message || preview.blocked_reason}
                </span>
              </div>
            )}

            {/* Candidates ranking if available from API */}
            {preview?.candidates && preview.candidates.length > 0 && (
              <div className="pt-2">
                <p className="text-xs font-semibold text-slate-900 mb-2">Live Candidate Ranking (Backend SmartRouter)</p>
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
                  {preview.candidates.map((cand: RouteCandidate) => (
                    <div
                      key={cand.connection_id}
                      className="p-3 bg-white flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <ProviderIcon provider={cand.provider} size={16} />
                        <div>
                          <p className="font-medium text-slate-900">{cand.display_name}</p>
                          <p className="text-[10px] text-slate-400 font-mono">
                            Free: {Math.round(cand.free_bytes / (1024 * 1024))} MB
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {cand.components && (
                          <div className="hidden sm:flex items-center gap-2 text-[10px] text-slate-500 font-mono">
                            <span>cap:{cand.components.capacity.toFixed(2)}</span>
                            <span>egress:{cand.components.egress.toFixed(2)}</span>
                            <span>perm:{cand.components.permanence.toFixed(2)}</span>
                          </div>
                        )}
                        <span
                          className={`font-mono font-semibold px-2 py-0.5 rounded text-[11px] ${
                            cand.eligible
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {cand.score !== null ? cand.score.toFixed(2) : 'Ineligible'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Policies List Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Active Routing Policies</CardTitle>
                <CardDescription>
                  Enforced tier placement rules executed on API write requests
                </CardDescription>
              </div>
              <Badge variant="outline" className="font-mono text-xs">
                {policies.length} Rules Enforced
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100">
              {policies.map((pol) => (
                <div key={pol.id} className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:bg-slate-50/50 transition-colors">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900 text-sm">{pol.title}</span>
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200/60 font-mono text-[10px] text-slate-600">
                        {pol.priority}
                      </span>
                    </div>
                    <p className="text-slate-500 mt-1 leading-normal max-w-2xl">{pol.description}</p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-50 border border-slate-200 text-xs">
                      <ProviderIcon provider={pol.target} size={15} />
                      <span className="font-medium text-slate-900 capitalize">{pol.target}</span>
                    </div>
                    <Badge variant="success" className="px-2 py-0.5">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>{pol.status}</span>
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
};
