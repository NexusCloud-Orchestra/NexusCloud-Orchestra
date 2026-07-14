import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import SearchShortcut from './SearchShortcut';
import SearchDropdown from './SearchDropdown';
import '../css/SearchBar.css';

// Mock searchable index matching system categories
const SEARCHABLE_INDEX = [
  // Files
  { id: 'f1', title: 'Project Proposal.pdf', category: 'Files', path: '/files' },
  { id: 'f2', title: 'Q2 Financial Report.xlsx', category: 'Files', path: '/files' },
  { id: 'f3', title: 'System Architecture.png', category: 'Files', path: '/files' },
  { id: 'f4', title: 'Resume_2026.docx', category: 'Files', path: '/files' },
  // Folders
  { id: 'fd1', title: 'Documents', category: 'Folders', path: '/files' },
  { id: 'fd2', title: 'Photos', category: 'Folders', path: '/files' },
  { id: 'fd3', title: 'Backup Archive', category: 'Folders', path: '/files' },
  // Cloud Providers
  { id: 'cp1', title: 'AWS S3 Bucket', category: 'Cloud Providers', path: '/clouds' },
  { id: 'cp2', title: 'Google Cloud Storage', category: 'Cloud Providers', path: '/clouds' },
  { id: 'cp3', title: 'Azure Blob Storage', category: 'Cloud Providers', path: '/clouds' },
  { id: 'cp4', title: 'Cloudflare R2', category: 'Cloud Providers', path: '/clouds' },
  // Settings & Pages
  { id: 'p1', title: 'Account Security', category: 'Settings', path: '/settings' },
  { id: 'p2', title: 'Subscription Management', category: 'Subscription', path: '/subscription' },
  { id: 'p3', title: 'Storage Metrics', category: 'Analytics', path: '/storage' },
  { id: 'p4', title: 'Analytics Dashboard', category: 'Analytics', path: '/analytics' },
  { id: 'p5', title: 'User Profile Settings', category: 'Settings', path: '/profile' },
];

function SearchBar() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const containerRef = useRef(null);
  const inputRef = useRef(null);

  // Load recent searches from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('nexus_recent_searches');
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (e) {
        console.error('Error parsing recent searches', e);
      }
    } else {
      // Default placeholder recent searches
      const defaults = [
        { id: 'f1', title: 'Project Proposal.pdf', category: 'Files', path: '/files' },
        { id: 'fd1', title: 'Documents', category: 'Folders', path: '/files' },
        { id: 'cp1', title: 'AWS S3 Bucket', category: 'Cloud Providers', path: '/clouds' },
      ];
      setRecentSearches(defaults);
      localStorage.setItem('nexus_recent_searches', JSON.stringify(defaults));
    }
  }, []);

  // Listen for Ctrl+K global keyboard event to focus search bar
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOpen(true);
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handle outside clicks to close the search panel
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Trigger loading skeleton and filtering when query changes
  useEffect(() => {
    if (!query) {
      setSearchResults([]);
      setSelectedIndex(0);
      return;
    }

    setLoading(true);
    const delayDebounce = setTimeout(() => {
      const filtered = SEARCHABLE_INDEX.filter((item) =>
        item.title.toLowerCase().includes(query.toLowerCase()) ||
        item.category.toLowerCase().includes(query.toLowerCase())
      );
      setSearchResults(filtered);
      setSelectedIndex(0);
      setLoading(false);
    }, 300); // 300ms simulated skeleton loading delay

    return () => clearTimeout(delayDebounce);
  }, [query]);

  // Navigate selection via Keyboard
  const handleKeyDown = (e) => {
    if (!isOpen) return;

    const listLength = query ? searchResults.length : recentSearches.length;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (listLength > 0 ? (prev + 1) % listLength : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (listLength > 0 ? (prev - 1 + listLength) % listLength : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const currentList = query ? searchResults : recentSearches;
      if (currentList.length > 0 && selectedIndex < currentList.length) {
        handleSelectItem(currentList[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  const handleSelectItem = (item) => {
    // Add to recent searches (prevent duplicates, max 5)
    const updated = [item, ...recentSearches.filter((r) => r.id !== item.id)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('nexus_recent_searches', JSON.stringify(updated));

    setIsOpen(false);
    setQuery('');
    navigate(item.path);
  };

  const handleRemoveRecent = (item) => {
    const updated = recentSearches.filter((r) => r.id !== item.id);
    setRecentSearches(updated);
    localStorage.setItem('nexus_recent_searches', JSON.stringify(updated));
    // Reset selectedIndex if it goes out of bounds
    if (selectedIndex >= updated.length && updated.length > 0) {
      setSelectedIndex(updated.length - 1);
    }
  };

  const handleSelectSuggestedAction = (action) => {
    setIsOpen(false);
    if (action.action === 'connect_cloud') {
      navigate('/connect-cloud');
    } else if (action.action === 'open_analytics') {
      navigate('/analytics');
    } else {
      // General actions redirect to files dashboard
      navigate('/files');
    }
  };

  return (
    <div className="navbar-search-wrapper" ref={containerRef} onKeyDown={handleKeyDown}>
      <div className="search-bar-container" onClick={() => setIsOpen(true)}>
        <span className="search-bar-icon">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </span>
        <input
          ref={inputRef}
          type="text"
          className="search-bar-input"
          placeholder="Search files, folders, cloud providers..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
        />
        <SearchShortcut />
      </div>

      <SearchDropdown
        isOpen={isOpen}
        loading={loading}
        query={query}
        recentSearches={recentSearches}
        searchResults={searchResults}
        selectedIndex={selectedIndex}
        onSelectAction={handleSelectSuggestedAction}
        onSelectResult={handleSelectItem}
        onSelectRecent={handleSelectItem}
        onRemoveRecent={handleRemoveRecent}
      />
    </div>
  );
}

export default SearchBar;
