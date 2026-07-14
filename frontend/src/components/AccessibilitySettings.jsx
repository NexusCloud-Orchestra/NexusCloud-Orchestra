import React from 'react';

function AccessibilitySettings({ accessibility, onChange }) {
  const settingsKeys = [
    { id: 'highContrast', label: 'High Contrast', desc: 'Increase contrast of borders, icons, and text labels.' },
    { id: 'keyboardNavigation', label: 'Keyboard Navigation', desc: 'Enable hotkeys and sequential tab focuses.' },
    { id: 'focusIndicators', label: 'Focus Indicators', desc: 'Show highly visible outlines around clicked items.' },
    { id: 'largeClickTargets', label: 'Large Click Targets', desc: 'Expand click area of sidebars and page buttons.' },
  ];

  const handleToggle = (id) => {
    onChange((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <div className="appearance-section-card">
      <h3 className="appearance-section-title">Accessibility</h3>
      <p className="appearance-section-desc">Configure visual guidance aids for the application workspace.</p>
      
      <div className="appearance-toggle-group">
        {settingsKeys.map((item) => (
          <div key={item.id} className="appearance-toggle-row">
            <div className="appearance-toggle-label-wrapper">
              <span className="appearance-toggle-label">{item.label}</span>
              <span className="appearance-toggle-sublabel">{item.desc}</span>
            </div>
            <label className="appearance-switch">
              <input
                type="checkbox"
                checked={accessibility[item.id] || false}
                onChange={() => handleToggle(item.id)}
              />
              <span className="appearance-switch-slider"></span>
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AccessibilitySettings;
