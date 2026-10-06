import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { CloudUpload, Download, Trash2, FileStack, File as FileIcon } from 'lucide-react';
import { fileApi, connectionApi, quotaApi, uploadToSignedUrl } from '../lib/api';
import { formatBytes, formatDate } from '../lib/utils';
import Alert from '../components/Alert';
import EmptyState from '../components/EmptyState';
import Modal from '../components/Modal';
import DonutChart from '../components/DonutChart';

const MAX_FILE_BYTES = 5 * 1024 * 1024 * 1024;

export default function Files() {
  const [files, setFiles] = useState([]);
  const [connections, setConnections] = useState([]);
  const [quota, setQuota] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [upload, setUpload] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const inputRef = useRef(null);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const results = await Promise.all([
        fileApi.list(),
        connectionApi.list(),
        quotaApi.summary(),
      ]);
      setFiles(results[0] || []);
      setConnections(results[1] || []);
      setQuota(results[2]);
    } catch (err) {
      setError(err.message || 'Could not load files.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const refreshQuietly = async () => {
    try {
      const results = await Promise.all([fileApi.list(), quotaApi.summary()]);
      setFiles(results[0] || []);
      setQuota(results[1]);
    } catch (err) {
      /* stale data is acceptable until the next manual refresh */
    }
  };

  const handleFiles = async (fileList) => {
    const file = fileList && fileList[0];
    if (!file || upload) return;

    setError('');
    setNotice('');

    if (connections.length === 0) {
      setError('Connect at least one cloud provider before uploading.');
      return;
    }
    if (file.size < 1) {
      setError('Empty files (0 bytes) cannot be uploaded.');
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setError('Files are limited to 5 GiB each.');
      return;
    }
    if (/[/\\]/.test(file.name)) {
      setError('Filenames cannot contain path separators.');
      return;
    }

    setUpload({ name: file.name, progress: 0, phase: 'requesting' });

    try {
      const ticket = await fileApi.uploadRequest({
        original_name: file.name,
        size_bytes: file.size,
        mime_type: file.type || 'application/octet-stream',
      });

      setUpload({ name: file.name, progress: 0, phase: 'uploading' });
      await uploadToSignedUrl({
        uploadUrl: ticket.upload_url,
        requiredHeaders: ticket.required_headers,
        file,
        onProgress: (pct) => setUpload((u) => (u ? Object.assign({}, u, { progress: pct }) : u)),
      });

      setUpload((u) => (u ? Object.assign({}, u, { progress: 100, phase: 'confirming' }) : u));
      await fileApi.confirmUpload(ticket.file_id);

      setNotice(`"${file.name}" uploaded and placed on ${ticket.provider}.`);
      await refreshQuietly();
    } catch (err) {
      setError(err.message || 'Upload failed. Please try again.');
    } finally {
      setUpload(null);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handleDownload = async (file) => {
    setError('');
    try {
      const data = await fileApi.download(file.id);
      window.open(data.download_url, '_blank', 'noopener,noreferrer');
    } catch (err) {
      setError(err.message || 'Could not get a download link.');
    }
  };

  const handleDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    setError('');
    try {
      await fileApi.remove(pendingDelete.id);
      setNotice(`"${pendingDelete.original_name}" deleted.`);
      setPendingDelete(null);
      await refreshQuietly();
    } catch (err) {
      setError(err.message || 'Could not delete the file.');
    } finally {
      setDeleting(false);
    }
  };

  const used = quota && quota.total_used_bytes ? quota.total_used_bytes : 0;
  const limit = quota && quota.total_limit_bytes ? quota.total_limit_bytes : 0;
  const byConnection = quota && quota.by_connection ? quota.by_connection : [];

  return (
    <div className="page-content-wrapper">
      <div className="page-header">
        <div>
          <h1 className="page-title">Files</h1>
          <p className="page-subtitle">
            Uploads go straight from your browser to the chosen cloud — NexusCloud never sees the bytes.
          </p>
        </div>
        <div className="page-actions">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => inputRef.current && inputRef.current.click()}
            disabled={Boolean(upload) || connections.length === 0}
          >
            <CloudUpload size={16} /> Upload file
          </button>
        </div>
      </div>

      {error ? <Alert type="error">{error}</Alert> : null}
      {notice ? <Alert type="success">{notice}</Alert> : null}

      <div
        className={`dropzone${dragOver ? ' drag-over' : ''}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => !upload && inputRef.current && inputRef.current.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && inputRef.current) inputRef.current.click();
        }}
        aria-label="Upload a file by dropping it here or browsing"
      >
        <input
          ref={inputRef}
          type="file"
          hidden
          onChange={(e) => handleFiles(e.target.files)}
        />
        {upload ? (
          <div style={{ width: '100%', maxWidth: 460 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, gap: 12 }}>
              <strong style={{ fontSize: '0.88rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {upload.name}
              </strong>
              <span style={{ fontSize: '0.78rem', color: 'var(--muted)', whiteSpace: 'nowrap' }}>
                {upload.phase === 'requesting' ? 'Requesting ticket…' : null}
                {upload.phase === 'uploading' ? `${upload.progress}%` : null}
                {upload.phase === 'confirming' ? 'Confirming…' : null}
              </span>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${upload.progress}%` }} />
            </div>
          </div>
        ) : (
          <>
            <div className="empty-state-icon"><CloudUpload size={24} /></div>
            <h3>Drop a file here, or click to browse</h3>
            <p>
              1 byte to 5 GiB per file. The router picks the best connected cloud and the
              browser PUTs directly to a signed URL.
            </p>
            {connections.length === 0 && !loading ? (
              <p style={{ color: 'var(--warning)', fontWeight: 600 }}>
                No clouds connected yet — <Link to="/connect-cloud" style={{ color: 'inherit' }}>connect one first</Link>.
              </p>
            ) : null}
          </>
        )}
      </div>

      <div className="card table-card">
        <div className="card-header" style={{ padding: 'var(--card-padding) var(--card-padding) 0' }}>
          <div>
            <h3 className="card-title">Active files</h3>
            <p className="card-subtitle">{files.length} object{files.length === 1 ? '' : 's'} in your pool</p>
          </div>
          {limit > 0 ? (
            <span className="badge badge-accent">{formatBytes(used)} of {formatBytes(limit)}</span>
          ) : null}
        </div>

        {loading ? (
          <div style={{ padding: 'var(--card-padding)' }}>
            {[0, 1, 2].map((i) => (
              <div key={i} className="skeleton" style={{ height: 44, marginBottom: 10 }} />
            ))}
          </div>
        ) : files.length === 0 ? (
          <EmptyState
            icon={<FileStack size={26} />}
            title="No files yet"
            message="Upload your first file and it will appear here with download and delete actions."
          />
        ) : (
          <div className="table-scroll">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Size</th>
                  <th>Type</th>
                  <th>Uploaded</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {files.map((f) => (
                  <tr key={f.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, maxWidth: 320 }}>
                        <FileIcon size={16} style={{ color: 'var(--muted)', flexShrink: 0 }} />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={f.original_name}>
                          {f.original_name}
                        </span>
                      </div>
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>{formatBytes(f.size_bytes)}</td>
                    <td style={{ color: 'var(--muted)' }}>{f.mime_type || '—'}</td>
                    <td style={{ color: 'var(--muted)', whiteSpace: 'nowrap' }}>{formatDate(f.uploaded_at)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                        <button
                          type="button"
                          className="btn-icon"
                          onClick={() => handleDownload(f)}
                          title="Download"
                          aria-label={`Download ${f.original_name}`}
                        >
                          <Download size={15} />
                        </button>
                        <button
                          type="button"
                          className="btn-icon"
                          onClick={() => setPendingDelete(f)}
                          title="Delete"
                          aria-label={`Delete ${f.original_name}`}
                          style={{ color: 'var(--danger)' }}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {limit > 0 ? (
        <div className="card" style={{ maxWidth: 560 }}>
          <div className="card-header">
            <div>
              <h3 className="card-title">Pool usage</h3>
              <p className="card-subtitle">Pending uploads reserve capacity until they expire</p>
            </div>
          </div>
          <DonutChart
            used={used}
            total={limit}
            segments={byConnection.map((c) => ({ id: c.connection_id, used: c.used_bytes }))}
          />
        </div>
      ) : null}

      {pendingDelete ? (
        <Modal
          title="Delete file?"
          subtitle={`"${pendingDelete.original_name}" will be removed from its cloud permanently.`}
          onClose={() => {
            if (!deleting) setPendingDelete(null);
          }}
          footer={
            <>
              <button type="button" className="btn btn-ghost" onClick={() => setPendingDelete(null)} disabled={deleting}>
                Cancel
              </button>
              <button type="button" className="btn btn-danger" onClick={handleDelete} disabled={deleting}>
                {deleting ? <span className="spinner" /> : null}
                Delete permanently
              </button>
            </>
          }
        >
          <p style={{ color: 'var(--muted)', fontSize: '0.88rem', lineHeight: 1.55 }}>
            This deletes the object from the destination bucket and releases its quota reservation.
            This action cannot be undone.
          </p>
        </Modal>
      ) : null}
    </div>
  );
}
