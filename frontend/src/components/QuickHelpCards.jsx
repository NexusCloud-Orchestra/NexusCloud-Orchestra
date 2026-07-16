import React from 'react';
import { Book, PlayCircle, MessageCircle, Ticket, Bug, Lightbulb } from 'lucide-react';

function QuickHelpCards({ onOpenChatModal }) {
  const handleScrollToForm = (category) => {
    const section = document.getElementById('support-ticket-form');
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
    }
    const catSelect = document.getElementById('ticket-category');
    if (catSelect && category) {
      catSelect.value = category;
      // Trigger native change event if React state needs it
      const event = new Event('change', { bubbles: true });
      catSelect.dispatchEvent(event);
    }
  };

  const cards = [
    {
      id: 'docs',
      icon: <Book size={24} />,
      title: 'Documentation',
      desc: 'Browse complete Nexus Cloud documentation.',
      btnLabel: 'Open Docs',
      action: () => alert('Opening Documentation page...'),
    },
    {
      id: 'tutorials',
      icon: <PlayCircle size={24} />,
      title: 'Video Tutorials',
      desc: 'Watch setup and usage tutorials.',
      btnLabel: 'Watch Videos',
      action: () => alert('Opening Tutorials page...'),
    },
    {
      id: 'chat',
      icon: <MessageCircle size={24} />,
      title: 'Live Chat',
      desc: 'Chat with our support team.',
      btnLabel: 'Start Chat',
      status: 'Online',
      action: () => {
        if (onOpenChatModal) {
          onOpenChatModal();
        } else {
          alert('Connecting to live chat agent... Modal active.');
        }
      },
    },
    {
      id: 'ticket',
      icon: <Ticket size={24} />,
      title: 'Support Ticket',
      desc: 'Report technical issues.',
      btnLabel: 'Create Ticket',
      primary: true,
      action: () => handleScrollToForm('Technical Issue'),
    },
    {
      id: 'bug',
      icon: <Bug size={24} />,
      title: 'Report Bug',
      desc: 'Report bugs or unexpected behavior.',
      btnLabel: 'Report Bug',
      action: () => handleScrollToForm('Bug Report'),
    },
    {
      id: 'feature',
      icon: <Lightbulb size={24} />,
      title: 'Feature Request',
      desc: 'Suggest new features.',
      btnLabel: 'Submit Request',
      action: () => handleScrollToForm('Feature Request'),
    },
  ];

  return (
    <div className="helpsupport-grid-3col" style={{ marginBottom: '40px' }}>
      {cards.map((item) => (
        <div key={item.id} className="help-card">
          <div className="help-card-header">
            <div className="help-card-icon">{item.icon}</div>
            {item.status && <span className="help-card-status-pill">{item.status}</span>}
          </div>
          <h3 className="help-card-title">{item.title}</h3>
          <p className="help-card-desc">{item.desc}</p>
          <button
            onClick={item.action}
            className={`help-card-button ${item.primary ? 'help-btn-primary' : ''}`}
          >
            {item.btnLabel}
          </button>
        </div>
      ))}
    </div>
  );
}

export default QuickHelpCards;
