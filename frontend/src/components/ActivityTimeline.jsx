import '../css/Tables.css';

function ActivityTimeline() {
  const activities = [
    { text: 'Uploaded Project_Design_v2.pdf', time: '10 mins ago', user: 'Demo User', provider: 'AWS S3' },
    { text: 'Connected AWS S3 bucket "nexus-prod-storage"', time: '1 hour ago', user: 'Demo User', provider: 'AWS' },
    { text: 'Deleted Temp Folder & cache chunks', time: '4 hours ago', user: 'Demo User', provider: 'Global' },
    { text: 'Created Shared Folder "Team Collaboration"', time: '1 day ago', user: 'Demo User', provider: 'Google Drive' },
    { text: 'Backup completed successfully', time: '1 day ago', user: 'System Agent', provider: 'Backblaze B2' },
  ];

  return (
    <div className="table-container" style={{ padding: '24px' }}>
      <h3 className="table-title" style={{ marginBottom: '20px' }}>Recent Activity</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {activities.map((act, i) => (
          <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <div style={{ fontSize: '18px', marginTop: '2px' }}>⏱️</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 }}>
              <span style={{ fontSize: '13.5px', fontWeight: 500, color: '#111827' }}>{act.text}</span>
              <div style={{ display: 'flex', gap: '8px', fontSize: '11px', color: '#6B7280' }}>
                <span>{act.time}</span>
                <span>•</span>
                <span>By {act.user}</span>
                <span>•</span>
                <span style={{ color: '#2563EB', fontWeight: 500 }}>{act.provider}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ActivityTimeline;
