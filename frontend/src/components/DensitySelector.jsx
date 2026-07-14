import React from 'react';

function DensitySelector({ value, onChange }) {
  const options = [
    { id: 'comfortable', name: 'Comfortable', lines: 3 },
    { id: 'compact', name: 'Compact', lines: 4 },
    { id: 'spacious', name: 'Spacious', lines: 2 },
  ];

  return (
    <div className="appearance-section-card">
      <h3 className="appearance-section-title">Density</h3>
      <p className="appearance-section-desc">Select how tight layout elements are spaced relative to each other.</p>
      
      <div className="density-options-row">
        {options.map((opt) => (
          <div
            key={opt.id}
            onClick={() => onChange(opt.id)}
            className={`density-option-card ${value === opt.id ? 'active' : ''}`}
          >
            <span className="density-title">{opt.name}</span>
            <div className="density-preview-box">
              {Array.from({ length: opt.lines }).map((_, idx) => (
                <div
                  key={idx}
                  style={{
                    height: '4px',
                    width: idx % 2 === 0 ? '80%' : '50%',
                    background: '#E5E7EB',
                    borderRadius: '2px',
                  }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default DensitySelector;
