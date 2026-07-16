import React from 'react';
import { HelpCircle } from 'lucide-react';

function CommunitySection() {
  const items = [
    { title: 'Community Forum', desc: 'Discuss cloud architectures and sharing setups with other users.', link: 'https://forum.example.com' },
    { title: 'GitHub Repository', desc: 'Browse the open-source client codebase and open issues.', link: 'https://github.com' },
    { title: 'Discord', desc: 'Join active developers for real-time cloud support chat.', link: 'https://discord.com' },
    { title: 'Developer Blog', desc: 'Read tips, tricks, and technical writeups from our engineering team.', link: 'https://blog.example.com' },
    { title: 'Release Notes', desc: 'Stay updated on hotfixes and new feature deployments.', link: '/help-support/releases' },
    { title: 'Roadmap', desc: 'Check upcoming features and vote on priority integrations.', link: '/help-support/roadmap' },
  ];

  return (
    <div className="helpsupport-grid-3col">
      {items.map((item) => (
        <div key={item.title} className="help-card">
          <div className="help-card-header">
            <div className="help-card-icon">
              <HelpCircle size={24} />
            </div>
          </div>
          <h3 className="help-card-title">{item.title}</h3>
          <p className="help-card-desc">{item.desc}</p>
          <a
            href={item.link}
            onClick={(e) => {
              e.preventDefault();
              alert(`Navigating to ${item.title}`);
            }}
            className="help-card-button"
          >
            Visit {item.title.split(' ')[0]}
          </a>
        </div>
      ))}
    </div>
  );
}

export default CommunitySection;
