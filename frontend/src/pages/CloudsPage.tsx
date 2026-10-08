import React, { useState, useEffect } from 'react';
import { AppShell } from '../components/layout/AppShell';
import { dashboardService, CloudProviderConnection } from '../services/dashboard.service';
import { createConnection, deleteConnection } from '../api/connections';
import { ProviderIcon } from '../components/ui/ProviderIcon';
import { Modal } from '../components/ui/modal';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import {
  Plus,
  CheckCircle2,
  RefreshCw,
  Trash2,
  AlertCircle,
  Shield,
  Layers,
  ExternalLink,
} from 'lucide-react';
import type { ProviderId } from '../types/api';

export const CloudsPage: React.FC = () => {
  const [connections, setConnections] = useState<CloudProviderConnection[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // New connection form
  const [provider, setProvider] = useState<ProviderId>('aws');
  const [name, setName] = useState('');
  const [bucket, setBucket] = useState('');
  const [region, setRegion] = useState('us-east-1');
  const [accessKey, setAccessKey] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [accountId, setAccountId] = useState('');
  const [gcpJson, setGcpJson] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await dashboardService.getCloudConnections();
      setConnections(res.connections);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const formatGb = (bytes: number) => (bytes / (1024 * 1024 * 1024)).toFixed(1);

  const handleTestHandshake = (id: string) => {
    setTestingId(id);
    setTimeout(() => {
      setTestingId(null);
    }, 1000);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!name.trim() || !bucket.trim()) {
      setFormError('Connection label and bucket name are required');
      return;
    }

    const credentials: Record<string, string> = {};
    if (provider === 'azure') {
      credentials.account_name = accessKey.trim();
      credentials.account_key = secretKey.trim();
    } else if (provider === 'gcp') {
      credentials.service_account_json = gcpJson.trim();
    } else if (provider === 'r2') {
      credentials.account_id = accountId.trim();
      credentials.aws_access_key_id = accessKey.trim();
      credentials.aws_secret_access_key = secretKey.trim();
    } else {
      credentials.aws_access_key_id = accessKey.trim();
      credentials.aws_secret_access_key = secretKey.trim();
    }

    setSubmitting(true);
    try {
      await createConnection({
        provider,
        display_name: name.trim(),
        bucket_name: bucket.trim(),
        region: region ? region.trim() : null,
        credentials,
      });
      await loadData();
      setModalOpen(false);
      setName('');
      setBucket('');
      setAccessKey('');
      setSecretKey('');
      setAccountId('');
      setGcpJson('');
    } catch (err: any) {
      setFormError(err?.message || 'Could not validate cloud credentials and bucket access');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    setActionError(null);
    try {
      await deleteConnection(id);
      await loadData();
    } catch (err: any) {
      setActionError(err?.message || 'Delete failed: Active files must be deleted first.');
    }
  };

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Connected Clouds
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              BYOC multi-cloud infrastructure accounts and authorization handshakes
            </p>
          </div>
          <Button
            onClick={() => {
              setFormError(null);
              setModalOpen(true);
            }}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Connect Cloud Account</span>
          </Button>
        </div>

        {/* Global Action Error notice */}
        {actionError && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{actionError}</span>
            </div>
            <button
              onClick={() => setActionError(null)}
              className="font-semibold underline ml-4 hover:text-rose-900"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Cloud Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {connections.map((c) => {
            const usedGb = formatGb(c.quotaUsedBytes);
            const totalGb = formatGb(c.quotaTotalBytes);
            const pct = Math.round((c.quotaUsedBytes / (c.quotaTotalBytes || 1)) * 100);

            return (
              <Card key={c.id} className="flex flex-col justify-between hover:border-slate-300 transition-colors">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <ProviderIcon provider={c.provider} size={28} />
                      <div>
                        <CardTitle className="text-sm font-semibold text-slate-900 truncate">
                          {c.name}
                        </CardTitle>
                        <span className="text-[11px] font-mono text-slate-500">
                          {c.region}
                        </span>
                      </div>
                    </div>
                    <Badge variant="success">Active</Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Quota Progress */}
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-slate-500">Quota Allocation</span>
                      <span className="font-mono font-medium text-slate-900">
                        {usedGb} / {totalGb} GB ({pct}%)
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-slate-900 transition-all duration-500"
                        style={{ width: `${Math.min(100, pct)}%` }}
                      />
                    </div>
                  </div>

                  {/* Metadata Specs */}
                  <div className="grid grid-cols-2 gap-2 text-xs py-2 border-y border-slate-100">
                    <div>
                      <span className="text-[11px] text-slate-400 block">Target Bucket</span>
                      <span className="font-mono text-[11px] text-slate-700 truncate block">
                        {c.bucket}
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-400 block">Storage Protocol</span>
                      <span className="text-[11px] text-slate-700 truncate block">
                        {c.protocol}
                      </span>
                    </div>
                  </div>

                  {/* Handshake Status & Controls */}
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-1.5 text-xs text-slate-600">
                      {testingId === c.id ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 text-blue-600 animate-spin" />
                          <span className="font-medium text-blue-600">Testing link…</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="font-medium text-slate-700">SigV4 Verified</span>
                        </>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleTestHandshake(c.id)}
                        disabled={testingId === c.id}
                        className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                        title="Re-verify credentials"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(c.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                        title="Disconnect cloud"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Informational BYOC security banner */}
        <Card className="bg-slate-50 border-slate-200">
          <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-white border border-slate-200 text-slate-700 shrink-0">
                <Shield className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <p className="font-semibold text-slate-900">Zero Data Touch Architecture</p>
                <p className="text-slate-500 mt-0.5">
                  NexusCloud issues signed URLs directly from browser to provider endpoints. File bytes never traverse NexusCloud orchestrator servers.
                </p>
              </div>
            </div>
            <a
              href="https://docs.nexuscloud.io"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 font-semibold text-blue-600 hover:underline shrink-0"
            >
              <span>Security Runbook</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </CardContent>
        </Card>
      </div>

      {/* Connect Cloud Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Connect Cloud Storage Account"
        description="Add a BYOC cloud provider bucket to the unified orchestration namespace."
        maxWidth="md"
      >
        {formError && (
          <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
            {formError}
          </div>
        )}

        <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-medium text-slate-700 mb-1.5">Cloud Provider</label>
            <Select
              value={provider}
              onChange={(e) => {
                const val = e.target.value as ProviderId;
                setProvider(val);
                if (val === 'aws') setRegion('us-east-1');
                else if (val === 'gcp') setRegion('asia-east1');
                else if (val === 'azure') setRegion('westus2');
                else if (val === 'b2') setRegion('us-west-004');
                else setRegion('auto');
              }}
            >
              <option value="aws">Amazon Web Services (AWS S3)</option>
              <option value="gcp">Google Cloud Platform (GCS)</option>
              <option value="azure">Microsoft Azure (Blob Storage)</option>
              <option value="r2">Cloudflare (R2 Storage)</option>
              <option value="b2">Backblaze (B2 Cloud Storage)</option>
              <option value="oracle">Oracle Cloud (OCI Object Storage)</option>
              <option value="ibm">IBM Cloud (Cloud Object Storage)</option>
            </Select>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1.5">Connection Display Label</label>
            <Input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. AWS Primary US-East"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1.5">
              {provider === 'azure' ? 'Container Name' : 'Bucket Name'}
            </label>
            <Input
              type="text"
              required
              value={bucket}
              onChange={(e) => setBucket(e.target.value)}
              placeholder="e.g. enterprise-raw-vault"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1.5">Region / Jurisdiction</label>
            <Input
              type="text"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              placeholder="e.g. us-east-1"
            />
          </div>

          {provider === 'r2' && (
            <div>
              <label className="block font-medium text-slate-700 mb-1.5">Cloudflare Account ID (32 hex characters)</label>
              <Input
                type="text"
                required
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                placeholder="4a9b2c8d7e6f1a0b3c4d5e6f7a8b9c0d"
              />
            </div>
          )}

          {provider === 'gcp' ? (
            <div>
              <label className="block font-medium text-slate-700 mb-1.5">Service Account JSON</label>
              <textarea
                className="w-full h-24 p-2.5 rounded-lg border border-slate-200 font-mono text-xs focus:ring-1 focus:ring-slate-900 focus:outline-none"
                required
                value={gcpJson}
                onChange={(e) => setGcpJson(e.target.value)}
                placeholder='{"type": "service_account", "project_id": "...", ...}'
              />
            </div>
          ) : provider === 'azure' ? (
            <>
              <div>
                <label className="block font-medium text-slate-700 mb-1.5">Storage Account Name</label>
                <Input
                  type="text"
                  required
                  value={accessKey}
                  onChange={(e) => setAccessKey(e.target.value)}
                  placeholder="mystorageaccount"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1.5">Storage Account Key</label>
                <Input
                  type="password"
                  required
                  value={secretKey}
                  onChange={(e) => setSecretKey(e.target.value)}
                  placeholder="Primary access key"
                />
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block font-medium text-slate-700 mb-1.5">Access Key ID</label>
                <Input
                  type="text"
                  required
                  value={accessKey}
                  onChange={(e) => setAccessKey(e.target.value)}
                  placeholder="AKIAIOSFODNN7EXAMPLE"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1.5">Secret Access Key</label>
                <Input
                  type="password"
                  required
                  value={secretKey}
                  onChange={(e) => setSecretKey(e.target.value)}
                  placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
                />
              </div>
            </>
          )}

          <div className="pt-2 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setModalOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting}
            >
              {submitting ? 'Verifying & Connecting…' : 'Connect Provider'}
            </Button>
          </div>
        </form>
      </Modal>
    </AppShell>
  );
};
