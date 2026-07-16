import React, { useState } from 'react';

function FeedbackSection() {
  const [helpful, setHelpful] = useState(null);
  const [improvementText, setImprovementText] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (helpful === null) {
      alert('Please select Yes or No first.');
      return;
    }
    alert(`Thank you for your feedback!\nHelpful: ${helpful ? 'Yes' : 'No'}\nComment: ${improvementText}`);
    setHelpful(null);
    setImprovementText('');
  };

  return (
    <div className="feedback-card">
      <h3 className="help-card-title" style={{ marginBottom: '16px' }}>Was this page helpful?</h3>
      <form onSubmit={handleSubmit}>
        <div className="feedback-helpful-row">
          <button
            type="button"
            onClick={() => setHelpful(true)}
            className={`feedback-btn ${helpful === true ? 'active' : ''}`}
          >
            👍 Yes
          </button>
          <button
            type="button"
            onClick={() => setHelpful(false)}
            className={`feedback-btn ${helpful === false ? 'active' : ''}`}
          >
            👎 No
          </button>
        </div>

        <div className="form-group" style={{ marginBottom: '16px' }}>
          <label className="form-label" style={{ marginBottom: '8px' }}>
            Tell us how we can improve:
          </label>
          <textarea
            value={improvementText}
            onChange={(e) => setImprovementText(e.target.value)}
            placeholder="Your suggestions..."
            className="form-textarea"
            style={{ minHeight: '80px' }}
          />
        </div>

        <button type="submit" className="form-btn form-btn-submit">
          Submit Feedback
        </button>
      </form>
    </div>
  );
}

export default FeedbackSection;
