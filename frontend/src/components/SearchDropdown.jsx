import React from 'react';
import RecentSearches from './RecentSearches';
import SearchResults from './SearchResults';
import '../css/SearchDropdown.css';

function SearchDropdown({
  isOpen,
  loading,
  query,
  recentSearches,
  searchResults,
  selectedIndex,
  onSelectAction,
  onSelectResult,
  onSelectRecent,
  onRemoveRecent,
}) {
  if (!isOpen) return null;

  const suggestedActions = [
    { title: 'Upload File', icon: '📄', type: 'action', action: 'upload_file' },
    { title: 'Upload Folder', icon: '📂', type: 'action', action: 'upload_folder' },
    { title: 'Connect Cloud', icon: '☁️', type: 'action', action: 'connect_cloud' },
    { title: 'Create Folder', icon: '📁', type: 'action', action: 'create_folder' },
    { title: 'Open Analytics', icon: '📊', type: 'action', action: 'open_analytics' },
  ];

  const handleActionClick = (action) => {
    onSelectAction(action);
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="search-skeleton-loader">
          {[1, 2, 3].map((n) => (
            <div key={n} className="search-skeleton-item">
              <div className="search-skeleton-circle"></div>
              <div className="search-skeleton-line"></div>
            </div>
          ))}
        </div>
      );
    }

    if (query) {
      if (searchResults.length === 0) {
        return <div className="search-empty-state">No results found.</div>;
      }
      return (
        <SearchResults
          results={searchResults}
          selectedIndex={selectedIndex}
          onSelect={onSelectResult}
        />
      );
    }

    return (
      <>
        {/* Suggested Actions Section */}
        <div className="search-category-group">
          <div className="search-section-header">Suggested Actions</div>
          <div className="suggested-actions-grid">
            {suggestedActions.map((action) => (
              <div
                key={action.action}
                className="suggested-action-item"
                onClick={() => handleActionClick(action)}
              >
                <span className="suggested-action-icon">{action.icon}</span>
                <span>{action.title}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Searches Section */}
        <RecentSearches
          items={recentSearches}
          selectedIndex={selectedIndex}
          onSelect={onSelectRecent}
          onRemove={onRemoveRecent}
        />
      </>
    );
  };

  return (
    <div className="search-dropdown-panel">
      <div className="search-dropdown-content">{renderContent()}</div>
    </div>
  );
}

export default SearchDropdown;
