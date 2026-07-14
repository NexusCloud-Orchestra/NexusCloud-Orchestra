import React from 'react';

function SearchShortcut() {
  const isMac = typeof window !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(window.navigator.userAgent);
  
  return (
    <span className="search-shortcut-badge">
      {isMac ? '⌘ K' : 'Ctrl K'}
    </span>
  );
}

export default SearchShortcut;
