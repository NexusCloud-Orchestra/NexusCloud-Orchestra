import React from 'react';

function SaveBar({ onSave, onCancel, onRestore }) {
  return (
    <div className="save-bar-container">
      <button
        onClick={onRestore}
        className="save-bar-btn restore-btn"
        type="button"
      >
        Restore Defaults
      </button>

      <button
        onClick={onCancel}
        className="save-bar-btn"
        type="button"
      >
        Cancel
      </button>

      <button
        onClick={onSave}
        className="save-bar-btn primary-btn"
        type="button"
      >
        Save Changes
      </button>
    </div>
  );
}

export default SaveBar;
