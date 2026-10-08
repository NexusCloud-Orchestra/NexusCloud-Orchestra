import { listConnections, createConnection as apiCreateConnection, deleteConnection as apiDeleteConnection } from '../api/connections';
import { listFiles as apiListFiles, deleteFile as apiDeleteFile } from '../api/files';
import { quotaSummary as apiQuotaSummary } from '../api/quota';
import { auditLogs as apiAuditLogs } from '../api/auth';
import { api } from '../api/client';
import type { Connection, FileRecord, QuotaSummary, AuditLog } from '../types/api';

export interface SystemHealth {
  status: string;
  service: string;
  version: string;
}

export interface CloudProviderConnection {
  id: string;
  provider: 'aws' | 'gcp' | 'azure' | 'r2' | 'b2';
  name: string;
  bucket: string;
  region: string;
  status: 'connected' | 'disconnected' | 'syncing' | 'error';
  quotaUsedBytes: number;
  quotaTotalBytes: number;
  lastSync?: string;
  protocol: string;
}

export interface RoutingDecision {
  id: string;
  fileName: string;
  fileSizeBytes: number;
  selectedProvider: 'aws' | 'gcp' | 'azure' | 'r2' | 'b2';
  score: number;
  reason: string;
  timestamp: string;
}

export interface ManagedFile {
  id: string;
  name: string;
  sizeBytes: number;
  mimeType: string;
  provider: 'aws' | 'gcp' | 'azure' | 'r2' | 'b2';
  region: string;
  updatedAt: string;
  status: 'synced' | 'replicating' | 'archived';
}

export interface ActivityEvent {
  id: string;
  type: 'upload' | 'routing' | 'connection' | 'sync' | 'auth';
  title: string;
  description: string;
  provider?: string;
  timestamp: string;
  status: 'success' | 'warning' | 'info';
}

class DashboardService {
  private STORAGE_KEY = 'nexuscloud_byoc_connections_v1';
  private FILES_KEY = 'nexuscloud_files_v1';

  public async getSystemHealth(): Promise<SystemHealth> {
    try {
      const data = await api<{ status: string }>({ method: 'GET', path: '/health', auth: false });
      return {
        status: data.status || 'ok',
        service: 'NexusCloud Core Engine',
        version: '1.0.0',
      };
    } catch {
      return {
        status: 'standby',
        service: 'NexusCloud Core Engine',
        version: '1.0.0',
      };
    }
  }

  /**
   * Fetches cloud connections from backend if authenticated and available,
   * combining with real /api/v1/quota/summary metrics.
   */
  public async getCloudConnections(): Promise<{
    connections: CloudProviderConnection[];
    isFromBackend: boolean;
  }> {
    try {
      const [backendConns, quota] = await Promise.all([
        listConnections(),
        apiQuotaSummary().catch(() => null),
      ]);

      if (Array.isArray(backendConns) && backendConns.length > 0) {
        const mapped: CloudProviderConnection[] = backendConns.map((c: Connection) => {
          const quotaEntry = quota?.by_connection?.find((q) => q.connection_id === c.id);
          const used = quotaEntry ? quotaEntry.used_bytes + quotaEntry.reserved_bytes : 0;
          const total = quotaEntry?.limit_bytes || 50 * 1024 * 1024 * 1024;
          return {
            id: c.id,
            provider: (['aws', 'gcp', 'azure', 'r2', 'b2'].includes(c.provider) ? c.provider : 'aws') as any,
            name: c.display_name,
            bucket: c.bucket_name,
            region: c.region || 'us-east-1',
            status: c.is_active ? 'connected' : 'disconnected',
            quotaUsedBytes: used,
            quotaTotalBytes: total,
            lastSync: c.created_at,
            protocol: `${c.provider.toUpperCase()} Native REST API`,
          };
        });
        return { connections: mapped, isFromBackend: true };
      }
    } catch {
      // Backend not reached or unauthenticated
    }

    return { connections: this.getStoredConnections(), isFromBackend: false };
  }

  public getStoredConnections(): CloudProviderConnection[] {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch {
      // fallback
    }

    const initial: CloudProviderConnection[] = [
      {
        id: 'conn-aws-s3-prod',
        provider: 'aws',
        name: 'AWS S3 Primary Bucket',
        bucket: 'nexus-us-east-archive',
        region: 'us-east-1',
        status: 'connected',
        quotaUsedBytes: 42.4 * 1024 * 1024 * 1024,
        quotaTotalBytes: 100 * 1024 * 1024 * 1024,
        lastSync: new Date(Date.now() - 14 * 60 * 1000).toISOString(),
        protocol: 'S3 REST API / SigV4',
      },
      {
        id: 'conn-gcp-gcs-prod',
        provider: 'gcp',
        name: 'Google Cloud Storage',
        bucket: 'nexus-gcs-dataset-asia',
        region: 'asia-east1',
        status: 'connected',
        quotaUsedBytes: 28.6 * 1024 * 1024 * 1024,
        quotaTotalBytes: 75 * 1024 * 1024 * 1024,
        lastSync: new Date(Date.now() - 32 * 60 * 1000).toISOString(),
        protocol: 'Google Cloud Storage v1',
      },
      {
        id: 'conn-azure-blob',
        provider: 'azure',
        name: 'Azure Blob Cold Tier',
        bucket: 'nexusbackupwest',
        region: 'westus2',
        status: 'connected',
        quotaUsedBytes: 18.2 * 1024 * 1024 * 1024,
        quotaTotalBytes: 50 * 1024 * 1024 * 1024,
        lastSync: new Date(Date.now() - 110 * 60 * 1000).toISOString(),
        protocol: 'Azure Storage Blob REST API',
      },
      {
        id: 'conn-cloudflare-r2',
        provider: 'r2',
        name: 'Cloudflare R2 Zero-Egress',
        bucket: 'nexus-edge-media-cdn',
        region: 'auto-jurisdiction',
        status: 'connected',
        quotaUsedBytes: 12.1 * 1024 * 1024 * 1024,
        quotaTotalBytes: 40 * 1024 * 1024 * 1024,
        lastSync: new Date(Date.now() - 6 * 60 * 1000).toISOString(),
        protocol: 'S3-compatible R2 API',
      },
      {
        id: 'conn-backblaze-b2',
        provider: 'b2',
        name: 'Backblaze B2 Vault',
        bucket: 'nexus-longterm-vault-01',
        region: 'us-west-004',
        status: 'connected',
        quotaUsedBytes: 8.5 * 1024 * 1024 * 1024,
        quotaTotalBytes: 30 * 1024 * 1024 * 1024,
        lastSync: new Date(Date.now() - 240 * 60 * 1000).toISOString(),
        protocol: 'B2 Native Cloud API',
      },
    ];

    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(initial));
    } catch {}

    return initial;
  }

  public saveConnection(conn: CloudProviderConnection): void {
    const list = this.getStoredConnections();
    const idx = list.findIndex((c) => c.id === conn.id);
    if (idx >= 0) {
      list[idx] = conn;
    } else {
      list.push(conn);
    }
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(list));
    } catch {}
  }

  public async deleteConnection(id: string): Promise<void> {
    try {
      await apiDeleteConnection(id);
    } catch {
      // Local fallback
    }
    const list = this.getStoredConnections().filter((c) => c.id !== id);
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(list));
    } catch {}
  }

  public async getManagedFiles(): Promise<ManagedFile[]> {
    try {
      const records = await apiListFiles();
      if (Array.isArray(records) && records.length > 0) {
        return records.map((f: FileRecord) => ({
          id: f.id,
          name: f.original_name,
          sizeBytes: f.size_bytes,
          mimeType: f.mime_type,
          provider: (['aws', 'gcp', 'azure', 'r2', 'b2'].includes(f.provider) ? f.provider : 'r2') as any,
          region: 'us-east-1',
          updatedAt: f.uploaded_at || new Date().toISOString(),
          status: f.status === 'active' ? 'synced' : 'replicating',
        }));
      }
    } catch {
      // Backend not reached or unauthenticated
    }
    return this.getStoredFiles();
  }

  public getStoredFiles(): ManagedFile[] {
    try {
      const data = localStorage.getItem(this.FILES_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch {}

    const initial: ManagedFile[] = [
      {
        id: 'file-01',
        name: 'genome_sequencing_dataset_v4.tar.gz',
        sizeBytes: 14.8 * 1024 * 1024 * 1024,
        mimeType: 'application/gzip',
        provider: 'r2',
        region: 'auto',
        updatedAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
        status: 'synced',
      },
      {
        id: 'file-02',
        name: 'financial_ledger_q3_audit.parquet',
        sizeBytes: 3.2 * 1024 * 1024 * 1024,
        mimeType: 'application/octet-stream',
        provider: 'aws',
        region: 'us-east-1',
        updatedAt: new Date(Date.now() - 75 * 60 * 1000).toISOString(),
        status: 'synced',
      },
      {
        id: 'file-03',
        name: 'satellite_infrared_imagery_apac.h5',
        sizeBytes: 8.7 * 1024 * 1024 * 1024,
        mimeType: 'application/x-hdf',
        provider: 'gcp',
        region: 'asia-east1',
        updatedAt: new Date(Date.now() - 140 * 60 * 1000).toISOString(),
        status: 'synced',
      },
      {
        id: 'file-04',
        name: 'disaster_recovery_snapshot_db.bak',
        sizeBytes: 24.1 * 1024 * 1024 * 1024,
        mimeType: 'application/x-backup',
        provider: 'b2',
        region: 'us-west-004',
        updatedAt: new Date(Date.now() - 360 * 60 * 1000).toISOString(),
        status: 'synced',
      },
      {
        id: 'file-05',
        name: 'enterprise_training_weights_llama.bin',
        sizeBytes: 12.4 * 1024 * 1024 * 1024,
        mimeType: 'application/octet-stream',
        provider: 'azure',
        region: 'westus2',
        updatedAt: new Date(Date.now() - 480 * 60 * 1000).toISOString(),
        status: 'synced',
      },
    ];

    try {
      localStorage.setItem(this.FILES_KEY, JSON.stringify(initial));
    } catch {}

    return initial;
  }

  public addFile(file: ManagedFile): void {
    const list = this.getStoredFiles();
    list.unshift(file);
    try {
      localStorage.setItem(this.FILES_KEY, JSON.stringify(list));
    } catch {}
  }

  public async deleteFile(id: string): Promise<void> {
    try {
      await apiDeleteFile(id);
    } catch {
      // Local fallback
    }
    const list = this.getStoredFiles().filter((f) => f.id !== id);
    try {
      localStorage.setItem(this.FILES_KEY, JSON.stringify(list));
    } catch {}
  }

  public getRoutingDecisions(): RoutingDecision[] {
    return [
      {
        id: 'rt-01',
        fileName: 'model_checkpoint_epoch_90.bin',
        fileSizeBytes: 4.8 * 1024 * 1024 * 1024,
        selectedProvider: 'r2',
        score: 96,
        reason: 'Zero egress cost for distributed model worker downloads',
        timestamp: new Date(Date.now() - 18 * 60 * 1000).toISOString(),
      },
      {
        id: 'rt-02',
        fileName: 'timeseries_telemetry_2026.parquet',
        fileSizeBytes: 1.6 * 1024 * 1024 * 1024,
        selectedProvider: 'gcp',
        score: 93,
        reason: 'Collocated with BigQuery compute cluster in asia-east1',
        timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
      },
      {
        id: 'rt-03',
        fileName: 'weekly_compliance_archive.tar',
        fileSizeBytes: 18.5 * 1024 * 1024 * 1024,
        selectedProvider: 'b2',
        score: 98,
        reason: 'Lowest long-term storage unit cost ($0.006/GB/mo)',
        timestamp: new Date(Date.now() - 110 * 60 * 1000).toISOString(),
      },
      {
        id: 'rt-04',
        fileName: 'active_session_event_logs.jsonl',
        fileSizeBytes: 620 * 1024 * 1024,
        selectedProvider: 'aws',
        score: 89,
        reason: 'Lowest IOPS write latency for active stream processing',
        timestamp: new Date(Date.now() - 190 * 60 * 1000).toISOString(),
      },
    ];
  }

  public async getActivityFeed(): Promise<ActivityEvent[]> {
    try {
      const logs = await apiAuditLogs();
      if (Array.isArray(logs) && logs.length > 0) {
        return logs.map((log: AuditLog) => {
          const type: ActivityEvent['type'] =
            log.action.includes('UPLOAD') || log.action.includes('FILE')
              ? 'upload'
              : log.action.includes('CONNECT')
              ? 'connection'
              : log.action.includes('AUTH') || log.action.includes('LOGIN') || log.action.includes('REGISTER')
              ? 'auth'
              : 'sync';

          return {
            id: log.id,
            type,
            title: log.action.replace(/_/g, ' '),
            description: log.resource_id ? `Resource: ${log.resource_id}` : `Logged via ${log.user_agent || 'Client'}`,
            timestamp: log.created_at,
            status: 'success',
          };
        });
      }
    } catch {
      // Backend not reached or unauthenticated
    }

    return [
      {
        id: 'act-01',
        type: 'upload',
        title: 'File Orchestrated to Cloudflare R2',
        description: 'model_checkpoint_epoch_90.bin (4.8 GB) placed via cost rule',
        provider: 'r2',
        timestamp: new Date(Date.now() - 18 * 60 * 1000).toISOString(),
        status: 'success',
      },
      {
        id: 'act-02',
        type: 'sync',
        title: 'Quota Rebalance Verified',
        description: 'Google Cloud Storage health check passed (28.6 GB allocated)',
        provider: 'gcp',
        timestamp: new Date(Date.now() - 32 * 60 * 1000).toISOString(),
        status: 'info',
      },
      {
        id: 'act-03',
        type: 'routing',
        title: 'Intelligent Routing Rule Triggered',
        description: 'timeseries_telemetry_2026.parquet routed to GCP for regional compute proximity',
        provider: 'gcp',
        timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
        status: 'success',
      },
      {
        id: 'act-04',
        type: 'connection',
        title: 'AWS S3 SigV4 Handshake Nominal',
        description: 'Bucket nexus-us-east-archive verified with 0 transport latency alerts',
        provider: 'aws',
        timestamp: new Date(Date.now() - 120 * 60 * 1000).toISOString(),
        status: 'success',
      },
      {
        id: 'act-05',
        type: 'auth',
        title: 'Enterprise Session Restored',
        description: 'Client token rotated with SHA-256 integrity verification',
        timestamp: new Date(Date.now() - 240 * 60 * 1000).toISOString(),
        status: 'info',
      },
    ];
  }
}

export const dashboardService = new DashboardService();
