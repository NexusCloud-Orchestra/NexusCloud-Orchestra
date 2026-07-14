import React from 'react';

function ThemeSelector({ value, onChange }) {
  const options = [
    { id: 'light', name: 'Light Mode', icon: '☀' },
    { id: 'dark', name: 'Dark Mode', icon: '🌙' },
    { id: 'system', name: 'System Default', icon: '💻' },
  ];

  return (
    <div className="appearance-section-card">
      <h3 className="appearance-section-title">Theme</h3>
      <p className="appearance-section-desc">Select how the workspace interface color scheme looks.</p>
      
      <div className="theme-radio-grid">
        {options.map((opt) => (
          <div
            key={opt.id}
            onClick={() => onChange(opt.id)}
            className={`theme-radio-card ${value === opt.id ? 'active' : ''}`}
          >
            <span className="theme-card-icon">{opt.icon}</span>
            <span className="theme-card-title">{opt.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ThemeSelector;
