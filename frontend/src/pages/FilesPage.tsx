import React, { useState, useEffect, useRef } from 'react';
import { AppShell } from '../components/layout/AppShell';
import { dashboardService, ManagedFile } from '../services/dashboard.service';
import { requestUpload, confirmUpload, cancelUpload, requestDownload, deleteFile as apiDeleteFile, listFiles } from '../api/files';
import { ProviderIcon } from '../components/ui/ProviderIcon';
import { Modal } from '../components/ui/modal';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { TabsList, TabsTrigger } from '../components/ui/tabs';
import {
  UploadCloud,
  Search,
  Trash2,
  Download,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import type { FileRecord } from '../types/api';

export const FilesPage: React.FC = () => {
  const [files, setFiles] = useState<ManagedFile[]>([]);
  const [search, setSearch] = useState('');
  const [selectedProvider, setSelectedProvider] = useState<string>('all');
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  // Upload modal state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadStatusText, setUploadStatusText] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const managed = await dashboardService.getManagedFiles();
      setFiles(managed);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filtered = files.filter((f) => {
    const matchesSearch = f.name.toLowerCase().includes(search.toLowerCase());
    const matchesProvider = selectedProvider === 'all' || f.provider === selectedProvider;
    return matchesSearch && matchesProvider;
  });

  const handleDelete = async (id: string) => {
    setErrorNotice(null);
    try {
      await apiDeleteFile(id);
      await loadData();
    } catch (err: any) {
      // Fallback
      await dashboardService.deleteFile(id);
      setFiles(dashboardService.getStoredFiles());
    }
  };

  const handleDownload = async (file: ManagedFile) => {
    setErrorNotice(null);
    try {
      const ticket = await requestDownload(file.id);
      if (ticket.download_url) {
        window.open(ticket.download_url, '_blank');
      }
    } catch (err: any) {
      setErrorNotice(err?.message || `Download unavailable for ${file.name}`);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setUploading(true);
    setUploadProgress(0);
    setUploadStatusText('Requesting upload placement ticket…');
    setErrorNotice(null);

    let fileId: string | null = null;
    try {
      // Step 1: Request placement ticket
      const ticket = await requestUpload({
        original_name: selectedFile.name,
        size_bytes: selectedFile.size,
        mime_type: selectedFile.type || 'application/octet-stream',
      });
      fileId = ticket.file_id;

      // Step 2: Upload file bytes directly via XHR PUT (Zero Data Touch)
      setUploadStatusText(`Direct streaming to ${ticket.provider.toUpperCase()} (${ticket.bucket_name})…`);

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', ticket.upload_url);

        // Apply required headers from backend ticket
        if (ticket.required_headers) {
          for (const [key, value] of Object.entries(ticket.required_headers)) {
            xhr.setRequestHeader(key, value);
          }
        }

        xhr.upload.onprogress = (evt) => {
          if (evt.lengthComputable) {
            const pct = Math.round((evt.loaded / evt.total) * 100);
            setUploadProgress(pct);
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error(`Storage provider rejected upload (HTTP ${xhr.status})`));
          }
        };

        xhr.onerror = () => reject(new Error('Network error during direct storage transfer'));
        xhr.send(selectedFile);
      });

      // Step 3: Confirm upload
      setUploadStatusText('Confirming storage object registration…');
      await confirmUpload(ticket.file_id);

      setUploadStatusText('Upload completed!');
      await loadData();
      setTimeout(() => {
        setUploadModalOpen(false);
        setSelectedFile(null);
        setUploadProgress(null);
        setUploading(false);
      }, 800);
    } catch (err: any) {
      // Step 4: Cancel reservation on failure
      if (fileId) {
        try {
          await cancelUpload(fileId);
        } catch {}
      }
      setErrorNotice(err?.message || 'Upload failed');
      setUploading(false);
      setUploadProgress(null);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes >= 1024 * 1024 * 1024) {
      return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
    }
    if (bytes >= 1024 * 1024) {
      return `${(bytes / (1024 * 1024)).toFixed(0)} MB`;
    }
    return `${(bytes / 1024).toFixed(0)} KB`;
  };

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Files & Storage Objects
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Distributed multi-cloud storage catalog with unified namespace
            </p>
          </div>
          <Button
            onClick={() => {
              setSelectedFile(null);
              setUploadProgress(null);
              setUploadModalOpen(true);
            }}
            className="gap-2"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload Object</span>
          </Button>
        </div>

        {/* Error notification */}
        {errorNotice && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{errorNotice}</span>
            </div>
            <button
              onClick={() => setErrorNotice(null)}
              className="font-semibold underline ml-4 hover:text-rose-900"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Filters Bar with Shadcn Input & Segmented Controls */}
        <Card className="p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search files by name…"
                className="pl-9"
              />
            </div>

            {/* Normal Shadcn Segmented Filter Tabs */}
            <TabsList className="overflow-x-auto max-w-full">
              {['all', 'aws', 'gcp', 'azure', 'r2', 'b2'].map((p) => (
                <TabsTrigger
                  key={p}
                  active={selectedProvider === p}
                  onClick={() => setSelectedProvider(p)}
                  className="capitalize"
                >
                  {p === 'all' ? 'All Providers' : p.toUpperCase()}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
        </Card>

        {/* Data Table */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-medium">
                <tr>
                  <th className="py-3 px-4">File Name</th>
                  <th className="py-3 px-4">Size</th>
                  <th className="py-3 px-4">Cloud Provider</th>
                  <th className="py-3 px-4">Region</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((f) => (
                  <tr key={f.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-medium text-slate-900 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                      <span className="truncate max-w-xs">{f.name}</span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600">{formatBytes(f.sizeBytes)}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 font-medium text-slate-700">
                        <ProviderIcon provider={f.provider} size={15} />
                        <span className="capitalize">{f.provider}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500">{f.region}</td>
                    <td className="py-3 px-4">
                      <Badge variant="success" className="px-2 py-0.5">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Synced</span>
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => handleDownload(f)}
                          className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                          title="Download signed URL"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(f.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                          title="Delete object"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500">
                      No files matching current criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Upload Modal with Direct Browser PUT */}
      <Modal
        isOpen={uploadModalOpen}
        onClose={() => !uploading && setUploadModalOpen(false)}
        title="Upload Object to Multi-Cloud Infrastructure"
        description="Smart Router will autonomously determine optimal provider placement."
      >
        <form onSubmit={handleUploadSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-medium text-slate-700 mb-1.5">Choose File</label>
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setSelectedFile(e.target.files[0]);
                }
              }}
              className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-slate-900 file:text-white hover:file:bg-slate-800 cursor-pointer"
              disabled={uploading}
              required
            />
          </div>

          {selectedFile && (
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
              <div className="flex justify-between font-mono text-[11px] text-slate-600">
                <span className="truncate max-w-[200px]">{selectedFile.name}</span>
                <span>{formatBytes(selectedFile.size)}</span>
              </div>
              <p className="text-[10px] text-slate-400">{selectedFile.type || 'application/octet-stream'}</p>
            </div>
          )}

          {uploading && (
            <div className="space-y-2 py-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-600 flex items-center gap-1.5">
                  <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
                  {uploadStatusText}
                </span>
                {uploadProgress !== null && (
                  <span className="font-mono font-medium text-slate-900">{uploadProgress}%</span>
                )}
              </div>
              <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-blue-600 transition-all duration-200"
                  style={{ width: `${uploadProgress ?? 0}%` }}
                />
              </div>
            </div>
          )}

          <div className="pt-2 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setUploadModalOpen(false)}
              disabled={uploading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!selectedFile || uploading}
            >
              {uploading ? 'Uploading…' : 'Start Placement & Upload'}
            </Button>
          </div>
        </form>
      </Modal>
    </AppShell>
  );
};
