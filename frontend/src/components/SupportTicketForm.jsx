import React, { useState } from 'react';

function SupportTicketForm() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    category: 'General',
    priority: 'Medium',
    subject: '',
    description: '',
  });
  const [attachments, setAttachments] = useState([]);

  const categories = [
    'General',
    'Cloud Connection',
    'Storage',
    'Billing',
    'Subscription',
    'Security',
    'Technical Issue',
    'Bug Report',
    'Feature Request',
  ];

  const priorities = ['Low', 'Medium', 'High', 'Critical'];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePrioritySelect = (level) => {
    setFormData((prev) => ({ ...prev, priority: level }));
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setAttachments((prev) => [...prev, ...files]);
  };

  const removeAttachment = (index) => {
    setAttachments((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.fullName || !formData.email || !formData.subject || !formData.description) {
      alert('Please fill out all required fields.');
      return;
    }
    alert(`Support Ticket submitted successfully!\n\nSubject: ${formData.subject}\nCategory: ${formData.category}\nPriority: ${formData.priority}`);
    setFormData({
      fullName: '',
      email: '',
      category: 'General',
      priority: 'Medium',
      subject: '',
      description: '',
    });
    setAttachments([]);
  };

  const handleCancel = () => {
    if (window.confirm('Discard ticket changes?')) {
      setFormData({
        fullName: '',
        email: '',
        category: 'General',
        priority: 'Medium',
        subject: '',
        description: '',
      });
      setAttachments([]);
    }
  };

  return (
    <div id="support-ticket-form" className="ticket-form-card">
      <form onSubmit={handleSubmit}>
        <div className="form-grid-2col">
          <div className="form-group">
            <label className="form-label">Full Name *</label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleInputChange}
              placeholder="e.g. Sarah Connor"
              className="form-input"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Email Address *</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="sarah@example.com"
              className="form-input"
              required
            />
          </div>
        </div>

        <div className="form-grid-2col">
          <div className="form-group">
            <label className="form-label">Category</label>
            <select
              id="ticket-category"
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              className="form-select"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Priority</label>
            <div className="priority-toggle-group">
              {priorities.map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => handlePrioritySelect(level)}
                  className={`priority-btn ${formData.priority === level ? 'active' : ''}`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Subject *</label>
          <input
            type="text"
            name="subject"
            value={formData.subject}
            onChange={handleInputChange}
            placeholder="e.g. S3 synchronization sync loop latency spike"
            className="form-input"
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Description *</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="Describe the issue in detail, including steps to reproduce."
            className="form-textarea"
            required
          />
        </div>

        <div className="form-group" style={{ marginBottom: '0' }}>
          <label className="form-label">Attachment Upload</label>
          <div className="file-upload-wrapper">
            <label className="file-upload-btn">
              Choose Files
              <input
                type="file"
                onChange={handleFileChange}
                multiple
                style={{ display: 'none' }}
              />
            </label>
          </div>
        </div>

        {attachments.length > 0 && (
          <div className="file-upload-list">
            {attachments.map((file, index) => (
              <div key={index} className="file-upload-item">
                <span>📎 {file.name} ({(file.size / 1024).toFixed(1)} KB)</span>
                <button
                  type="button"
                  onClick={() => removeAttachment(index)}
                  className="file-remove-btn"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="form-actions">
          <button type="button" onClick={handleCancel} className="form-btn form-btn-cancel">
            Cancel
          </button>
          <button type="submit" className="form-btn form-btn-submit">
            Submit Ticket
          </button>
        </div>
      </form>
    </div>
  );
}

export default SupportTicketForm;
