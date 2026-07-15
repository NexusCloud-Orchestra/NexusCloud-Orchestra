import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../config';

function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('nexus_access_token');
    if (!token) {
      navigate('/login');
      return;
    }

    if (token === 'mock_demo_token') {
      setUser({
        first_name: 'Demo',
        last_name: 'User',
        email: 'demo@nexus.com',
        plan: 'pro',
      });
      return;
    }

    fetch(`${API_URL}/api/v1/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (res.status === 401) {
          localStorage.removeItem('nexus_access_token');
          navigate('/login');
          throw new Error('Unauthorized');
        }
        return res.json();
      })
      .then((data) => setUser(data))
      .catch((err) => console.error(err));
  }, [navigate]);

  if (!user) return <div className="page-content-wrapper"><p>Loading profile...</p></div>;

  return (
    <div className="page-content-wrapper">
      <div className="welcome-header-section">
        <h1 className="welcome-heading">My Profile</h1>
        <p className="welcome-subtitle">Manage Supervisor account identity details.</p>
      </div>

      <div
        style={{
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          padding: '24px',
          maxWidth: '600px',
        }}
      >
        <h2 style={{ fontSize: '18px', fontWeight: 600, margin: '0 0 16px 0' }}>Profile Details</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase' }}>First Name</label>
            <p style={{ margin: '4px 0 0 0', fontSize: '15px', color: 'var(--text)', fontWeight: 500 }}>{user.first_name}</p>
          </div>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase' }}>Last Name</label>
            <p style={{ margin: '4px 0 0 0', fontSize: '15px', color: 'var(--text)', fontWeight: 500 }}>{user.last_name}</p>
          </div>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase' }}>Email Address</label>
            <p style={{ margin: '4px 0 0 0', fontSize: '15px', color: 'var(--text)', fontWeight: 500 }}>{user.email}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;
