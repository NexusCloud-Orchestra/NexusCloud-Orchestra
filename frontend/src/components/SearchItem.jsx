import React from 'react';

function SearchItem({ item, isSelected, onSelect, onRemove }) {
  // Determine icon based on category or item type
  const getIcon = () => {
    switch (item.category?.toLowerCase()) {
      case 'files':
        return '📄';
      case 'folders':
        return '📂';
      case 'cloud providers':
        return '☁️';
      case 'settings':
        return '👤';
      case 'subscription':
        return '💳';
      case 'analytics':
        return '📊';
      default:
        return '🔍';
    }
  };

  return (
    <div
      className={`search-item-wrapper ${isSelected ? 'selected' : ''}`}
      onClick={onSelect}
    >
      <div className="search-item-left">
        <span className="search-item-icon">{getIcon()}</span>
        <div className="search-item-title-wrapper">
          <span className="search-item-title">{item.title}</span>
        </div>
      </div>
      
      {onRemove ? (
        <button
          className="search-item-remove-btn"
          onClick={(e) => {
            e.stopPropagation();
            onRemove(item);
          }}
          title="Remove from history"
        >
          ✕
        </button>
      ) : (
        <span className="search-item-category">{item.category}</span>
      )}
    </div>
  );
}

export default SearchItem;
