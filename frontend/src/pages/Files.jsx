import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import RecentFiles from '../components/RecentFiles';
import { API_URL } from '../config';

function Files() {
  const navigate = useNavigate();
  const [files, setFiles] = useState([]);
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadFileName, setUploadFileName] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    const token = localStorage.getItem('nexus_access_token');
    if (!token) {
      navigate('/login');
      return;
    }

    // Demo mode — show empty state
    if (token === 'mock_demo_token') {
      setConnections([]);
      setFiles([]);
      setLoading(false);
      return;
    }

    try {
      // 1. Fetch active connections
      const connRes = await fetch(`${API_URL}/api/v1/connections`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (connRes.status === 401) {
        localStorage.removeItem('nexus_access_token');
        navigate('/login');
        return;
      }
      const activeConns = connRes.ok ? await connRes.json() : [];
      setConnections(activeConns);

      // 2. Fetch files list
      const fileRes = await fetch(`${API_URL}/api/v1/files`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (fileRes.ok) {
        const fileList = await fileRes.json();
        setFiles(fileList);
      }
    } catch (err) {
      setErrorMessage('Network error fetching storage data.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (connections.length === 0) {
      setErrorMessage('Please link at least one Cloud Provider first.');
      return;
    }

    setErrorMessage('');
    setSuccessMessage('');
    setUploading(true);
    setUploadProgress(0);
    setUploadFileName(file.name);

    const token = localStorage.getItem('nexus_access_token');

    try {
      // Step 1: Request Upload URL from Smart Router
      const reqRes = await fetch(`${API_URL}/api/v1/files/upload-request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          original_name: file.name,
          size_bytes: file.size,
          mime_type: file.type || 'application/octet-stream'
        })
      });

      if (!reqRes.ok) {
        const errData = await reqRes.json();
        throw new Error(errData.detail || 'Upload request failed');
      }

      const reqData = await reqRes.json();
      const { file_id, upload_url } = reqData;

      // Step 2: Upload Binary Payload using XMLHttpRequest (to track progress!)
      await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', upload_url);
        xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const pct = Math.round((event.loaded / event.total) * 100);
            setUploadProgress(pct);
          }
        };

        xhr.onload = () => {
          if (xhr.status === 200 || xhr.status === 201 || xhr.status === 204) {
            resolve();
          } else {
            reject(new Error(`Binary transfer failed with status ${xhr.status}`));
          }
        };

        xhr.onerror = () => reject(new Error('Network error during transfer.'));
        xhr.send(file);
      });

      // Step 3: Confirm Upload
      const confirmRes = await fetch(`${API_URL}/api/v1/files/confirm-upload/${file_id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (confirmRes.ok) {
        setSuccessMessage(`File "${file.name}" uploaded and synchronized successfully!`);
        fetchInitialData(); // Refresh list & quota

        // Audio & Desktop notification triggers
        try {
          const saved = localStorage.getItem('nexus_appearance_settings');
          if (saved) {
            const parsed = JSON.parse(saved);
            if (parsed.notifications) {
              if (parsed.notifications.playSound !== false) {
                const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-84.wav');
                audio.play().catch(e => console.error('Audio chime failed:', e));
              }
              if (parsed.notifications.desktop !== false) {
                if (Notification.permission === 'granted') {
                  new Notification('Upload Complete', {
                    body: `File "${file.name}" uploaded and synchronized successfully!`,
                  });
                } else if (Notification.permission !== 'denied') {
                  Notification.requestPermission().then(permission => {
                    if (permission === 'granted') {
                      new Notification('Upload Complete', {
                        body: `File "${file.name}" uploaded and synchronized successfully!`,
                      });
                    }
                  });
                }
              }
            }
          } else {
            // Default behavior if settings don't exist yet: play sound & show notification
            const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-84.wav');
            audio.play().catch(e => console.error('Audio chime failed:', e));
            
            if (Notification.permission === 'granted') {
              new Notification('Upload Complete', {
                body: `File "${file.name}" uploaded and synchronized successfully!`,
              });
            }
          }
        } catch (e) {
          console.error('Failed to trigger notifications', e);
        }
      } else {
        const errData = await confirmRes.json();
        throw new Error(errData.detail || 'Upload confirmation failed');
      }

    } catch (err) {
      setErrorMessage(err.message || 'File upload failed.');
    } finally {
      setUploading(false);
      setUploadFileName('');
      setUploadProgress(0);
    }
  };

  const handleDownloadFile = async (fileId) => {
    const token = localStorage.getItem('nexus_access_token');
    try {
      const res = await fetch(`${API_URL}/api/v1/files/download/${fileId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        // Open download link in a new window or trigger download
        window.open(data.download_url, '_blank');
      } else {
        alert('Failed to retrieve file download link.');
      }
    } catch (err) {
      alert('Network error downloading file.');
    }
  };

  const handleDeleteFile = async (fileId) => {
    if (!window.confirm('Are you sure you want to delete this file permanently?')) {
      return;
    }
    const token = localStorage.getItem('nexus_access_token');
    try {
      const res = await fetch(`${API_URL}/api/v1/files/${fileId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setSuccessMessage('File deleted successfully.');
        fetchInitialData();
      } else {
        alert('Failed to delete file.');
      }
    } catch (err) {
      alert('Network error deleting file.');
    }
  };

  return (
    <div className="page-content-wrapper">
      <style>{`
        .uploader-zone {
          border: 2px dashed var(--border);
          border-radius: 8px;
          background-color: var(--card);
          padding: 40px 24px;
          text-align: center;
          margin-bottom: 32px;
          transition: border-color 0.2s ease;
          position: relative;
        }
        .uploader-zone:hover {
          border-color: var(--primary);
        }
        .uploader-title {
          font-size: 16px;
          font-weight: 600;
          color: var(--text);
          margin: 0 0 8px 0;
        }
        .uploader-subtitle {
          font-size: 13px;
          color: var(--muted);
          margin: 0 0 20px 0;
        }
        .file-input-btn {
          background-color: var(--input-bg);
          border: 1px solid var(--border);
          color: var(--text);
          padding: 10px 20px;
          border-radius: 6px;
          font-weight: 600;
          font-size: 13.5px;
          cursor: pointer;
          display: inline-block;
        }
        .file-input-btn:hover {
          border-color: var(--primary);
        }
        .progress-bar-container {
          max-width: 400px;
          margin: 20px auto 0 auto;
          background: var(--border);
          border-radius: 999px;
          height: 8px;
          overflow: hidden;
        }
        .progress-bar-fill {
          height: 100%;
          background: var(--primary);
          border-radius: 999px;
          transition: width 0.1s linear;
        }
        .progress-text {
          font-size: 12.5px;
          color: var(--muted);
          margin-top: 8px;
          font-weight: 500;
        }
      `}</style>

      <div className="welcome-header-section">
        <h1 className="welcome-heading">My Files</h1>
        <p className="welcome-subtitle">Browse, search, upload, and sync files across your linked storage volumes.</p>
      </div>

      {successMessage && <div className="clouds-success-banner">{successMessage}</div>}
      {errorMessage && <div className="clouds-error-banner">{errorMessage}</div>}

      {connections.length === 0 ? (
        <div className="files-warning-banner">
          <span>⚠️</span>
          <span>
            <strong>No active cloud storage providers linked.</strong> Please link an account in the <strong>Cloud Providers</strong> tab first to establish a storage destination for uploads.
          </span>
        </div>
      ) : (
        <div className="uploader-zone">
          {uploading ? (
            <div>
              <div className="uploader-title">Uploading File...</div>
              <div className="uploader-subtitle" style={{ fontFamily: 'monospace' }}>{uploadFileName}</div>
              <div className="progress-bar-container">
                <div className="progress-bar-fill" style={{ width: `${uploadProgress}%` }} />
              </div>
              <div className="progress-text">{uploadProgress}% complete</div>
            </div>
          ) : (
            <div>
              <div className="uploader-title">Select a File to Upload</div>
              <div className="uploader-subtitle">Vanguard Smart Router will automatically analyze and route your file to the optimal cloud provider.</div>
              <label className="file-input-btn">
                Browse Files
                <input type="file" onChange={handleFileUpload} style={{ display: 'none' }} />
              </label>
            </div>
          )}
        </div>
      )}

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', fontSize: '15px', color: '#6B7280' }}>Loading storage directories...</div>
      ) : (
        <RecentFiles files={files} onDownload={handleDownloadFile} onDelete={handleDeleteFile} />
      )}
    </div>
  );
}

export default Files;
