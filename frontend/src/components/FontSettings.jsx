import React from 'react';

function FontSettings({ fontSize, fontFamily, onChangeFontSize, onChangeFontFamily }) {
  const families = [
    { id: 'Inter', name: 'Inter' },
    { id: 'Roboto', name: 'Roboto' },
    { id: 'Open Sans', name: 'Open Sans' },
    { id: 'Poppins', name: 'Poppins' },
    { id: 'system-ui', name: 'System Default' },
  ];

  const sizeLabels = ['Small', 'Medium', 'Large', 'Extra Large'];

  return (
    <div className="appearance-section-card">
      <div className="appearance-grid-two-cols">
        {/* Section 5: Font Size */}
        <div>
          <h3 className="appearance-section-title">Font Size</h3>
          <p className="appearance-section-desc">Adjust layout text readability level.</p>
          
          <div className="font-slider-container">
            <input
              type="range"
              min="0"
              max="3"
              step="1"
              value={fontSize}
              onChange={(e) => onChangeFontSize(Number(e.target.value))}
              className="font-slider"
            />
          </div>
          <div className="font-slider-labels">
            {sizeLabels.map((lbl, idx) => (
              <span
                key={lbl}
                style={{
                  fontWeight: fontSize === idx ? '600' : '400',
                  color: fontSize === idx ? 'var(--accent-color, #2563EB)' : '#6B7280',
                }}
              >
                {lbl}
              </span>
            ))}
          </div>
        </div>

        {/* Section 6: Font Family */}
        <div>
          <h3 className="appearance-section-title">Font Family</h3>
          <p className="appearance-section-desc">Select the typography font styling.</p>
          
          <select
            value={fontFamily}
            onChange={(e) => onChangeFontFamily(e.target.value)}
            className="appearance-select"
          >
            {families.map((fam) => (
              <option key={fam.id} value={fam.id}>
                {fam.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

export default FontSettings;
