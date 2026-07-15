import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useTheme from '../hooks/useTheme';
import ThemeSelector from '../components/ThemeSelector';
import AccentColorPicker from '../components/AccentColorPicker';
import SidebarSettings from '../components/SidebarSettings';
import DensitySelector from '../components/DensitySelector';
import FontSettings from '../components/FontSettings';
import AccessibilitySettings from '../components/AccessibilitySettings';
import AppearancePreview from '../components/AppearancePreview';
import SaveBar from '../components/SaveBar';
import '../css/Appearance.css';

const DEFAULT_SETTINGS = {
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
  const { theme, setTheme } = useTheme();
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
    document.documentElement.style.setProperty('--primary', accentHex);

    const fontSizes = { 0: '12px', 1: '14px', 2: '16px', 3: '18px' };
    document.documentElement.style.setProperty('--base-font-size', fontSizes[settings.fontSize]);
    document.documentElement.style.setProperty('--font-family', settings.fontFamily === 'system-ui' ? 'sans-serif' : `"${settings.fontFamily}", sans-serif`);
    document.documentElement.setAttribute('data-density', settings.density);
  }, [settings.accentColor, settings.fontSize, settings.fontFamily, settings.density]);

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
        document.documentElement.style.setProperty('--primary', accentHex);

        const fontSizes = { 0: '12px', 1: '14px', 2: '16px', 3: '18px' };
        document.documentElement.style.setProperty('--base-font-size', fontSizes[parsed.fontSize]);
        document.documentElement.style.setProperty('--font-family', parsed.fontFamily === 'system-ui' ? 'sans-serif' : `"${parsed.fontFamily}", sans-serif`);
        document.documentElement.setAttribute('data-density', parsed.density);
      } catch (e) {
        console.error(e);
      }
    } else {
      // Revert to defaults if no saved preferences exist
      document.documentElement.style.removeProperty('--accent-color');
      document.documentElement.style.removeProperty('--primary-color');
      document.documentElement.style.removeProperty('--primary');
      document.documentElement.style.removeProperty('--base-font-size');
      document.documentElement.style.removeProperty('--font-family');
      document.documentElement.removeAttribute('data-density');
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
              value={theme}
              onChange={(newTheme) => setTheme(newTheme)}
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


          </div>

          {/* SECTION 13: Live Preview Column (Sticky) */}
          <div>
            <AppearancePreview
              theme={theme}
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
