/** Shared formatting + settings helpers. */

/** Contract: 1 GiB = 1,073,741,824 bytes. */
export function formatBytes(bytes) {
  if (!bytes || bytes <= 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KiB', 'MiB', 'GiB', 'TiB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), sizes.length - 1);
  const value = bytes / Math.pow(k, i);
  return `${value >= 100 ? Math.round(value) : value.toFixed(1)} ${sizes[i]}`;
}

export function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function timeAgo(iso) {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 0) return 'just now';
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function planLabel(plan) {
  if (!plan) return 'Free';
  return plan.charAt(0).toUpperCase() + plan.slice(1);
}

/** Map an array of 422 {field, message} details onto a {field: message} object. */
export function detailsToFieldErrors(details) {
  const out = {};
  (details || []).forEach((d) => {
    if (d?.field) {
      // 'body.email' -> 'email'
      const key = d.field.split('.').pop();
      out[key] = d.message;
    }
  });
  return out;
}

/* ------------------------------------------------------------------ */
/* Appearance settings: single source of truth used by App + Appearance */
/* ------------------------------------------------------------------ */

export const DEFAULT_SETTINGS = {
  accentColor: 'blue',
  theme: 'light',
  sidebar: { expanded: true, icons_only: false },
  density: 'comfortable',
  fontSize: 1, // 0: small, 1: medium, 2: large, 3: extra large
  fontFamily: 'Sora',
  animations: { enable: true, reduceMotion: false },
  notifications: { desktop: true, playSound: false },
  accessibility: { highContrast: false, keyboardNav: false, focusIndicators: false, largeTargets: false },
};

export const ACCENT_COLORS = {
  blue: '#4F7DF9',
  teal: '#0FB5A8',
  green: '#22B573',
  orange: '#F5873B',
  coral: '#F2545B',
  indigo: '#6366F1',
};

const SETTINGS_KEY = 'nexus_appearance_settings';

export function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      sidebar: { ...DEFAULT_SETTINGS.sidebar, ...(parsed.sidebar || {}) },
      animations: { ...DEFAULT_SETTINGS.animations, ...(parsed.animations || {}) },
      notifications: { ...DEFAULT_SETTINGS.notifications, ...(parsed.notifications || {}) },
      accessibility: { ...DEFAULT_SETTINGS.accessibility, ...(parsed.accessibility || {}) },
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

/** Apply visual settings to the document root (CSS variables + data attrs). */
export function applySettings(settings) {
  const root = document.documentElement;

  const accentHex = ACCENT_COLORS[settings.accentColor] || ACCENT_COLORS.blue;
  root.style.setProperty('--accent', accentHex);

  const fontSizes = { 0: '13px', 1: '14px', 2: '15.5px', 3: '17px' };
  root.style.setProperty('--base-font-size', fontSizes[settings.fontSize] ?? fontSizes[1]);
  root.style.setProperty(
    '--font-family',
    settings.fontFamily === 'system-ui'
      ? "system-ui, -apple-system, 'Segoe UI', sans-serif"
      : `"${settings.fontFamily}", system-ui, sans-serif`
  );

  root.setAttribute('data-density', settings.density || 'comfortable');
  root.setAttribute('data-animations-enabled', String(settings.animations?.enable !== false));
  root.setAttribute('data-reduce-motion', String(settings.animations?.reduceMotion === true));
  root.setAttribute('data-high-contrast', String(settings.accessibility?.highContrast === true));
  root.setAttribute('data-keyboard-navigation', String(settings.accessibility?.keyboardNav === true));
  root.setAttribute('data-focus-indicators', String(settings.accessibility?.focusIndicators === true));
  root.setAttribute('data-large-click-targets', String(settings.accessibility?.largeTargets === true));
}
