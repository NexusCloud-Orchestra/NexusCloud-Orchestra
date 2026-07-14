import React from 'react';

function AccentColorPicker({ value, onChange }) {
  const colors = [
    { id: 'blue', name: 'Blue (Default)', hex: '#2563EB' },
    { id: 'green', name: 'Green', hex: '#16A34A' },
    { id: 'purple', name: 'Purple', hex: '#9333EA' },
    { id: 'orange', name: 'Orange', hex: '#EA580C' },
    { id: 'red', name: 'Red', hex: '#DC2626' },
    { id: 'gray', name: 'Gray', hex: '#4B5563' },
  ];

  return (
    <div className="appearance-section-card">
      <h3 className="appearance-section-title">Accent Color</h3>
      <p className="appearance-section-desc">Select the color highlight for buttons, links, active items, and focus indicators.</p>
      
      <div className="accent-color-list">
        {colors.map((color) => (
          <div
            key={color.id}
            onClick={() => onChange(color.id)}
            className={`accent-color-pill ${value === color.id ? 'active' : ''}`}
            title={color.name}
          >
            <div
              className="accent-color-inner"
              style={{ backgroundColor: color.hex }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export default AccentColorPicker;
