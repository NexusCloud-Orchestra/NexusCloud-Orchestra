import React from 'react';
import { useNavigate } from 'react-router-dom';

function HelpHeader() {
  const navigate = useNavigate();

  return (
    <header className="helpsupport-header">
      <div className="helpsupport-breadcrumbs">
        <span onClick={() => navigate('/')}>Home</span>
        <span>/</span>
        <span style={{ color: '#111827', fontWeight: 500 }}>Help & Support</span>
      </div>
      <h1 className="helpsupport-title">Help & Support</h1>
      <p className="helpsupport-subtitle">
        Need help? Browse documentation, troubleshoot issues, or contact our support team.
      </p>
    </header>
  );
}

export default HelpHeader;
