import React from 'react';
import { Sun, Moon } from 'lucide-react';
import useTheme from '../hooks/useTheme';
import '../css/ThemeToggle.css';

function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div
      className={`theme-toggle-container ${theme === 'dark' ? 'dark-active' : ''}`}
      role="radiogroup"
      aria-label="Interface theme preference selection"
    >
      {/* Sliding background track active indicator */}
      <div className="theme-toggle-indicator" />

      {/* Light Mode Selector */}
      <button
        type="button"
        role="radio"
        aria-checked={theme === 'light'}
        aria-label="Switch to Light Mode"
        title="Switch to Light Mode"
        onClick={() => setTheme('light')}
        className={`theme-toggle-option light-opt ${theme === 'light' ? 'active' : ''}`}
      >
        <Sun size={14} strokeWidth={2.5} />
        <span>Light</span>
      </button>

      {/* Dark Mode Selector */}
      <button
        type="button"
        role="radio"
        aria-checked={theme === 'dark'}
        aria-label="Switch to Dark Mode"
        title="Switch to Dark Mode"
        onClick={() => setTheme('dark')}
        className={`theme-toggle-option dark-opt ${theme === 'dark' ? 'active' : ''}`}
      >
        <Moon size={14} strokeWidth={2.5} />
        <span>Dark</span>
      </button>
    </div>
  );
}

export default ThemeToggle;
