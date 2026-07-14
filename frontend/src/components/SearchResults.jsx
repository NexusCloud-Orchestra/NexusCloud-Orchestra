import React from 'react';
import SearchItem from './SearchItem';

function SearchResults({ results, selectedIndex, onSelect }) {
  if (!results || results.length === 0) return null;

  // Group items by category
  const categories = results.reduce((acc, item) => {
    const cat = item.category || 'Other';
    if (!acc[cat]) {
      acc[cat] = [];
    }
    acc[cat].push(item);
    return acc;
  }, {});

  // Maintain overall flat index tracking for keyboard navigation highlighting
  let currentFlatIndex = 0;

  return (
    <div className="search-results-container">
      {Object.keys(categories).map((catName) => {
        const catItems = categories[catName];
        return (
          <div key={catName} className="search-category-group">
            <div className="search-section-header">{catName}</div>
            <div className="search-results-list">
              {catItems.map((item) => {
                // Find matching index in original flat results array
                const originalIndex = results.findIndex((r) => r.id === item.id && r.title === item.title);
                
                return (
                  <SearchItem
                    key={item.id || item.title}
                    item={item}
                    isSelected={selectedIndex === originalIndex}
                    onSelect={() => onSelect(item)}
                  />
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default SearchResults;
