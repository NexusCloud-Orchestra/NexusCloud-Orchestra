import React from 'react';
import SearchItem from './SearchItem';

function RecentSearches({ items, selectedIndex, offset = 0, onSelect, onRemove }) {
  if (!items || items.length === 0) return null;

  return (
    <div className="search-category-group">
      <div className="search-section-header">Recent Searches</div>
      <div className="search-results-list">
        {items.map((item, idx) => {
          const globalIdx = offset + idx;
          return (
            <SearchItem
              key={item.id || item.title}
              item={item}
              isSelected={selectedIndex === globalIdx}
              onSelect={() => onSelect(item)}
              onRemove={onRemove}
            />
          );
        })}
      </div>
    </div>
  );
}

export default RecentSearches;
