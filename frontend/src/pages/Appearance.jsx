import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ThemeSelector from '../components/ThemeSelector';
import AccentColorPicker from '../components/AccentColorPicker';
import SidebarSettings from '../components/SidebarSettings';
import DensitySelector from '../components/DensitySelector';
import FontSettings from '../components/FontSettings';
import LanguageSelector from '../components/LanguageSelector';
import AccessibilitySettings from '../components/AccessibilitySettings';
import AppearancePreview from '../components/AppearancePreview';
import SaveBar from '../components/SaveBar';
import '../css/Appearance.css';

const DEFAULT_SETTINGS = {
  theme: 'system',
  accentColor: 'blue',
  sidebar: {
    expanded: true,
    collapsed: false,
    auto: false,
    icons_only: false,
  },
  density: 'comfortable',
  fontSize: 1, // Medium (0: Small, 1: Medium, 2: Large, 3: Extra Large)
  fontFamily: 'Inter',
  dashboardLayout: 'default',
  animations: {
    enable: true,
    reduceMotion: false,
  },
  notifications: {
    playSound: true,
    desktop: true,
    badgeCount: true,
  },
  accessibility: {
    highContrast: false,
    keyboardNavigation: true,
    focusIndicators: true,
    largeClickTargets: false,
  },
  language: 'en',
  dateFormat: 'DD/MM/YYYY',
  timeFormat: '12h',
};

function Appearance() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [successBanner, setSuccessBanner] = useState('');

  // Load preferences on mount
  useEffect(() => {
    const saved = localStorage.getItem('nexus_appearance_settings');
    if (saved) {
      try {
        setSettings(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  // Apply settings preview instantly to the document
  useEffect(() => {
    let activeTheme = settings.theme;
    if (activeTheme === 'system') {
      activeTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    document.documentElement.setAttribute('data-theme', activeTheme);

    const colors = {
      blue: '#2563EB',
      green: '#16A34A',
      purple: '#9333EA',
      orange: '#EA580C',
      red: '#DC2626',
      gray: '#4B5563',
    };
    const accentHex = colors[settings.accentColor] || '#2563EB';
    document.documentElement.style.setProperty('--accent-color', accentHex);
    document.documentElement.style.setProperty('--primary-color', accentHex);

    const fontSizes = { 0: '12px', 1: '14px', 2: '16px', 3: '18px' };
    document.documentElement.style.setProperty('--base-font-size', fontSizes[settings.fontSize]);
    document.documentElement.style.setProperty('--font-family', settings.fontFamily === 'system-ui' ? 'sans-serif' : settings.fontFamily);
  }, [settings.theme, settings.accentColor, settings.fontSize, settings.fontFamily]);

  const handleSave = () => {
    localStorage.setItem('nexus_appearance_settings', JSON.stringify(settings));

    setSuccessBanner('Appearance settings updated successfully.');
    window.scrollTo({ top: 0, behavior: 'smooth' });

    setTimeout(() => {
      setSuccessBanner('');
    }, 3000);
  };

  const handleCancel = () => {
    // Re-apply original saved settings to revert the live preview
    const saved = localStorage.getItem('nexus_appearance_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        let activeTheme = parsed.theme;
        if (activeTheme === 'system') {
          activeTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }
        document.documentElement.setAttribute('data-theme', activeTheme);

        const colors = {
          blue: '#2563EB',
          green: '#16A34A',
          purple: '#9333EA',
          orange: '#EA580C',
          red: '#DC2626',
          gray: '#4B5563',
        };
        const accentHex = colors[parsed.accentColor] || '#2563EB';
        document.documentElement.style.setProperty('--accent-color', accentHex);
        document.documentElement.style.setProperty('--primary-color', accentHex);

        const fontSizes = { 0: '12px', 1: '14px', 2: '16px', 3: '18px' };
        document.documentElement.style.setProperty('--base-font-size', fontSizes[parsed.fontSize]);
        document.documentElement.style.setProperty('--font-family', parsed.fontFamily === 'system-ui' ? 'sans-serif' : parsed.fontFamily);
      } catch (e) {
        console.error(e);
      }
    } else {
      // Revert to defaults if no saved preferences exist
      document.documentElement.removeAttribute('data-theme');
      document.documentElement.style.removeProperty('--accent-color');
      document.documentElement.style.removeProperty('--primary-color');
      document.documentElement.style.removeProperty('--base-font-size');
      document.documentElement.style.removeProperty('--font-family');
    }
    navigate('/');
  };

  const handleRestore = () => {
    if (window.confirm('Restore appearance parameters to default settings?')) {
      setSettings(DEFAULT_SETTINGS);
    }
  };

  return (
    <div className="page-content-wrapper">
      <div className="appearance-page-container">
        {/* Page Header */}
        <header className="appearance-header">
          <h1 className="appearance-title">Appearance</h1>
          <p className="appearance-subtitle">Customize how Nexus Cloud looks and feels.</p>
        </header>

        {successBanner && (
          <div className="success-banner" style={{ background: '#DCFCE7', border: '1px solid #16A34A', color: '#14532D', padding: '12px 16px', borderRadius: '6px', marginBottom: '20px', fontWeight: 600 }}>
            {successBanner}
          </div>
        )}

        <div className="appearance-layout-grid">
          {/* Settings Section Columns */}
          <div className="appearance-sections-stack">
            {/* SECTION 1: Theme */}
            <ThemeSelector
              value={settings.theme}
              onChange={(theme) => setSettings((prev) => ({ ...prev, theme }))}
            />

            {/* SECTION 2: Accent Color */}
            <AccentColorPicker
              value={settings.accentColor}
              onChange={(accentColor) => setSettings((prev) => ({ ...prev, accentColor }))}
            />

            {/* SECTION 3: Sidebar */}
            <SidebarSettings
              state={settings.sidebar}
              onChange={(updateFn) =>
                setSettings((prev) => ({
                  ...prev,
                  sidebar: typeof updateFn === 'function' ? updateFn(prev.sidebar) : updateFn,
                }))
              }
            />

            {/* SECTION 4: Density */}
            <DensitySelector
              value={settings.density}
              onChange={(density) => setSettings((prev) => ({ ...prev, density }))}
            />

            {/* SECTION 5 & 6: Font Settings */}
            <FontSettings
              fontSize={settings.fontSize}
              fontFamily={settings.fontFamily}
              onChangeFontSize={(fontSize) => setSettings((prev) => ({ ...prev, fontSize }))}
              onChangeFontFamily={(fontFamily) => setSettings((prev) => ({ ...prev, fontFamily }))}
            />

            {/* SECTION 7: Dashboard Layout */}
            <div className="appearance-section-card">
              <h3 className="appearance-section-title">Dashboard Layout</h3>
              <p className="appearance-section-desc">Select configuration structure of the primary dashboard view.</p>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                {[
                  { id: 'default', name: 'Default Layout', desc: 'Balanced summary charts and quick links.' },
                  { id: 'compact', name: 'Compact Layout', desc: 'Denser resource lists, summary metrics only.' },
                  { id: 'analytics', name: 'Analytics First', desc: 'Historical usage trends charts prioritized.' },
                  { id: 'storage', name: 'Storage First', desc: 'Storage connected pool allocation prioritized.' },
                ].map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setSettings((prev) => ({ ...prev, dashboardLayout: item.id }))}
                    className={`sidebar-option-card ${settings.dashboardLayout === item.id ? 'active' : ''}`}
                    style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '4px', textAlign: 'left' }}
                  >
                    <span style={{ fontWeight: 600 }}>{item.name}</span>
                    <span style={{ fontSize: '11px', color: '#6B7280', fontWeight: 'normal' }}>{item.desc}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* SECTION 8: Animations */}
            <div className="appearance-section-card">
              <h3 className="appearance-section-title">Animations</h3>
              <p className="appearance-section-desc">Configure layout transition speed preferences.</p>
              
              <div className="appearance-toggle-group">
                <div className="appearance-toggle-row">
                  <div className="appearance-toggle-label-wrapper">
                    <span className="appearance-toggle-label">Enable Interface Animations</span>
                    <span className="appearance-toggle-sublabel">Smooth transitions when loading folders/files.</span>
                  </div>
                  <label className="appearance-switch">
                    <input
                      type="checkbox"
                      checked={settings.animations.enable}
                      onChange={() =>
                        setSettings((prev) => ({
                          ...prev,
                          animations: { ...prev.animations, enable: !prev.animations.enable },
                        }))
                      }
                    />
                    <span className="appearance-switch-slider"></span>
                  </label>
                </div>

                <div className="appearance-toggle-row">
                  <div className="appearance-toggle-label-wrapper">
                    <span className="appearance-toggle-label">Reduce Motion</span>
                    <span className="appearance-toggle-sublabel">Minimize active scaling transitions.</span>
                  </div>
                  <label className="appearance-switch">
                    <input
                      type="checkbox"
                      checked={settings.animations.reduceMotion}
                      onChange={() =>
                        setSettings((prev) => ({
                          ...prev,
                          animations: { ...prev.animations, reduceMotion: !prev.animations.reduceMotion },
                        }))
                      }
                    />
                    <span className="appearance-switch-slider"></span>
                  </label>
                </div>
              </div>
            </div>

            {/* SECTION 9: Notifications */}
            <div className="appearance-section-card">
              <h3 className="appearance-section-title">Notifications</h3>
              <p className="appearance-section-desc">Configure active sync update banners.</p>
              
              <div className="appearance-toggle-group">
                {[
                  { id: 'playSound', label: 'Play notification sound', desc: 'Audio chime when actions complete.' },
                  { id: 'desktop', label: 'Show desktop notifications', desc: 'System alert popups for active uploads.' },
                  { id: 'badgeCount', label: 'Badge count', desc: 'Show sync totals overlay inside navigation.' },
                ].map((item) => (
                  <div key={item.id} className="appearance-toggle-row">
                    <div className="appearance-toggle-label-wrapper">
                      <span className="appearance-toggle-label">{item.label}</span>
                      <span className="appearance-toggle-sublabel">{item.desc}</span>
                    </div>
                    <label className="appearance-switch">
                      <input
                        type="checkbox"
                        checked={settings.notifications[item.id]}
                        onChange={() =>
                          setSettings((prev) => ({
                            ...prev,
                            notifications: { ...prev.notifications, [item.id]: !prev.notifications[item.id] },
                          }))
                        }
                      />
                      <span className="appearance-switch-slider"></span>
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* SECTION 10: Accessibility */}
            <AccessibilitySettings
              accessibility={settings.accessibility}
              onChange={(updateFn) =>
                setSettings((prev) => ({
                  ...prev,
                  accessibility: typeof updateFn === 'function' ? updateFn(prev.accessibility) : updateFn,
                }))
              }
            />

            {/* SECTION 11 & 12: Language & Format selectors */}
            <LanguageSelector
              language={settings.language}
              dateFormat={settings.dateFormat}
              timeFormat={settings.timeFormat}
              onChangeLanguage={(language) => setSettings((prev) => ({ ...prev, language }))}
              onChangeDateFormat={(dateFormat) => setSettings((prev) => ({ ...prev, dateFormat }))}
              onChangeTimeFormat={(timeFormat) => setSettings((prev) => ({ ...prev, timeFormat }))}
            />
          </div>

          {/* SECTION 13: Live Preview Column (Sticky) */}
          <div>
            <AppearancePreview
              theme={settings.theme}
              accentColor={settings.accentColor}
              fontSize={settings.fontSize}
              sidebar={settings.sidebar}
              fontFamily={settings.fontFamily}
            />
          </div>
        </div>

        {/* Bottom Actions SaveBar */}
        <SaveBar
          onSave={handleSave}
          onCancel={handleCancel}
          onRestore={handleRestore}
        />
      </div>
    </div>
  );
}

export default Appearance;
