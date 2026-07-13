import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

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

    fetch('http://localhost:8000/auth/me', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
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
          background: '#FFFFFF',
          border: '1px solid #E5E7EB',
          borderRadius: '8px',
          padding: '24px',
          maxWidth: '600px',
        }}
      >
        <h2 style={{ fontSize: '18px', fontWeight: 600, margin: '0 0 16px 0' }}>Profile Details</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase' }}>First Name</label>
            <p style={{ margin: '4px 0 0 0', fontSize: '15px', color: '#111827', fontWeight: 500 }}>{user.first_name}</p>
          </div>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase' }}>Last Name</label>
            <p style={{ margin: '4px 0 0 0', fontSize: '15px', color: '#111827', fontWeight: 500 }}>{user.last_name}</p>
          </div>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase' }}>Email Address</label>
            <p style={{ margin: '4px 0 0 0', fontSize: '15px', color: '#111827', fontWeight: 500 }}>{user.email}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;
