import React from 'react';

function SidebarSettings({ state, onChange }) {
  const options = [
    { id: 'expanded', name: 'Expanded Sidebar' },
    { id: 'collapsed', name: 'Collapsed Sidebar' },
    { id: 'auto', name: 'Auto Collapse' },
    { id: 'icons_only', name: 'Show Sidebar Icons Only' },
  ];

  const handleToggle = (id) => {
    onChange((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <div className="appearance-section-card">
      <h3 className="appearance-section-title">Sidebar</h3>
      <p className="appearance-section-desc">Customize layout behaviors of the main navigation drawer.</p>
      
      <div className="sidebar-options-grid">
        {options.map((opt) => (
          <div
            key={opt.id}
            onClick={() => handleToggle(opt.id)}
            className={`sidebar-option-card ${state[opt.id] ? 'active' : ''}`}
          >
            {opt.name}
          </div>
        ))}
      </div>
    </div>
  );
}

export default SidebarSettings;
