import React from 'react';
import '../css/AppearanceCards.css';

const ACCENT_COLORS = {
  blue: '#2563EB',
  green: '#16A34A',
  purple: '#9333EA',
  orange: '#EA580C',
  red: '#DC2626',
  gray: '#4B5563',
};

const FONT_SIZES = {
  0: '12px',
  1: '14px',
  2: '16px',
  3: '18px',
};

function AppearancePreview({ theme, accentColor, fontSize, sidebar, fontFamily }) {
  const currentAccent = ACCENT_COLORS[accentColor] || '#2563EB';
  const currentFontSize = FONT_SIZES[fontSize] || '14px';

  // Styles for the preview container depending on theme
  const getThemeStyles = () => {
    if (theme === 'dark') {
      return {
        bg: '#0F172A',
        card: '#1E293B',
        text: '#F8FAFC',
        muted: '#94A3B8',
        border: '#334155',
      };
    }
    return {
      bg: '#F8FAFC',
      card: '#ffffff',
      text: '#111827',
      muted: '#6B7280',
      border: '#E5E7EB',
    };
  };

  const activeTheme = getThemeStyles();

  return (
    <div className="appearance-preview-sticky">
      <h3 className="appearance-section-title">Live Preview</h3>
      <p className="appearance-section-desc">Instantly preview layout style modifications.</p>

      <div
        className="preview-container-mock"
        style={{
          backgroundColor: activeTheme.bg,
          borderColor: activeTheme.border,
          fontFamily: fontFamily === 'system-ui' ? 'sans-serif' : fontFamily,
          fontSize: currentFontSize,
        }}
      >
        {/* Mock Navbar */}
        <div
          className="mock-navbar"
          style={{
            backgroundColor: activeTheme.card,
            borderBottomColor: activeTheme.border,
          }}
        >
          <span className="mock-logo" style={{ color: activeTheme.text }}>
            ☁️ Nexus
          </span>
          <div
            className="mock-search"
            style={{
              backgroundColor: theme === 'dark' ? '#0F172A' : '#F3F4F6',
              borderColor: activeTheme.border,
            }}
          />
          <div
            style={{
              width: '18px',
              height: '18px',
              borderRadius: '50%',
              backgroundColor: '#9CA3AF',
            }}
          />
        </div>

        {/* Mock Body */}
        <div className="mock-body-area">
          {/* Mock Sidebar */}
          <div
            className={`mock-sidebar ${sidebar.expanded ? 'expanded' : ''}`}
            style={{
              backgroundColor: activeTheme.card,
              borderRightColor: activeTheme.border,
            }}
          >
            <div
              className="mock-sidebar-item active"
              style={{ backgroundColor: currentAccent }}
            >
              <div className="mock-sidebar-bullet" style={{ backgroundColor: '#ffffff' }} />
              {sidebar.expanded && (
                <div className="mock-sidebar-text" style={{ backgroundColor: '#ffffff' }} />
              )}
            </div>
            <div className="mock-sidebar-item">
              <div className="mock-sidebar-bullet" />
              {sidebar.expanded && <div className="mock-sidebar-text" />}
            </div>
            <div className="mock-sidebar-item">
              <div className="mock-sidebar-bullet" />
              {sidebar.expanded && <div className="mock-sidebar-text" />}
            </div>
          </div>

          {/* Mock Content area */}
          <div className="mock-content-panel">
            <div className="mock-content-title" style={{ backgroundColor: activeTheme.muted }} />
            
            <div
              className="mock-card"
              style={{
                backgroundColor: activeTheme.card,
                borderColor: activeTheme.border,
              }}
            >
              <div className="mock-card-line" style={{ backgroundColor: activeTheme.border }} />
              <div className="mock-card-line short" style={{ backgroundColor: activeTheme.border }} />
              
              <button
                className="mock-button"
                style={{ backgroundColor: currentAccent }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AppearancePreview;
