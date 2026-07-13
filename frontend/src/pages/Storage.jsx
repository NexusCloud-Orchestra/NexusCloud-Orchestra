import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import StorageChart from '../components/StorageChart';
import Analytics from '../components/Analytics';
import { API_URL } from '../config';

function Storage() {
  const navigate = useNavigate();
  const [quota, setQuota] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuotaData();
  }, []);

  const fetchQuotaData = async () => {
    setLoading(true);
    const token = localStorage.getItem('nexus_access_token');
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      const quotaRes = await fetch(`${API_URL}/api/v1/quota/summary`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (quotaRes.status === 401) {
        localStorage.removeItem('nexus_access_token');
        navigate('/login');
        return;
      }
      const quotaData = quotaRes.ok ? await quotaRes.json() : null;
      setQuota(quotaData);
    } catch (err) {
      console.error('Error fetching quota summary:', err);
    } finally {
      setLoading(false);
    }
  };

  const usedBytes = quota?.total_used_bytes || 0;

  if (loading) {
    return (
      <div style={{ padding: '80px 0', textAlign: 'center', fontSize: '15px', color: '#6B7280' }}>
        Loading storage allocation...
      </div>
    );
  }

  return (
    <div className="page-content-wrapper">
      <div className="welcome-header-section">
        <h1 className="welcome-heading">Storage Management</h1>
        <p className="welcome-subtitle">Detailed breakdown of virtual volume sizes and usage patterns.</p>
      </div>

      <div className="dashboard-grid-two-cols">
        <div>
          <StorageChart connections={quota?.by_connection || []} totalUsed={usedBytes} />
        </div>
        <div>
          <Analytics />
        </div>
      </div>
    </div>
  );
}

export default Storage;
